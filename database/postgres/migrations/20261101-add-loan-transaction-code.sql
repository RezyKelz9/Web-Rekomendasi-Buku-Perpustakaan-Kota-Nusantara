ALTER TABLE loans ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(20);

CREATE OR REPLACE FUNCTION loan_code_suffix() RETURNS text AS $$
DECLARE
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  suffix text := '';
  i integer;
BEGIN
  FOR i IN 1..4 LOOP
    suffix := suffix || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  END LOOP;
  RETURN suffix;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  loan_row record;
  new_code text;
  attempts integer;
BEGIN
  FOR loan_row IN SELECT id, borrowed_at FROM loans WHERE transaction_code IS NULL LOOP
    attempts := 0;
    LOOP
      new_code := 'PJM-' || to_char(loan_row.borrowed_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD')
        || '-' || loan_code_suffix();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM loans WHERE transaction_code = new_code);
      attempts := attempts + 1;
      IF attempts > 50 THEN
        RAISE EXCEPTION 'Gagal membuat kode transaksi unik untuk loan %', loan_row.id;
      END IF;
    END LOOP;
    UPDATE loans SET transaction_code = new_code WHERE id = loan_row.id;
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS loan_code_suffix();

ALTER TABLE loans ALTER COLUMN transaction_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_transaction_code ON loans(transaction_code);
