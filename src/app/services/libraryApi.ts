import { apiClient } from "./apiClient";
import type { Shelf, Category, Book } from "../data/libraryData";

function mapApiShelf(row: Record<string, unknown>): Shelf {
  const categoriesStr = (row.categories as string) || "";
  return {
    id: row.kode as string,
    dbId: Number(row.id),
    name: row.name as string,
    location: (row.location as string) || "",
    floor: Number(row.floor) || 1,
    categories: categoriesStr ? categoriesStr.split(",") : [],
    capacity: Number(row.capacity) || 0,
    occupied: 0,
  };
}

function mapApiCategory(row: Record<string, unknown>): Category {
  return {
    id: row.kode as string,
    dbId: Number(row.id),
    name: row.name as string,
    color: (row.color as string) || "bg-sky-100 text-sky-700",
    icon: (row.icon as string) || "BookOpen",
    description: (row.description as string) || "",
    count: Number(row.book_count) || 0,
  };
}

function mapApiBook(row: Record<string, unknown>): Book {
  const stock = Number(row.stock) || 0;
  const availableStock = row.available_stock !== undefined ? Number(row.available_stock) : stock;
  return {
    id: String(row.id),
    title: row.title as string,
    author: row.author as string,
    categoryId: (row.category_id as string) || "",
    shelfId: (row.shelf_id as string) || "",
    shelfPosition: (row.shelf_position as string) || "",
    cover: (row.cover as string) || "",
    rating: Number(row.rating) || 0,
    year: Number(row.published_year) || 0,
    pages: Number(row.pages) || 0,
    isbn: (row.isbn as string) || "",
    available: availableStock > 0,
    availableStock,
    stock,
    description: (row.description as string) || "",
    publisher: (row.publisher as string) || "",
    recommended: Boolean(row.recommended),
  };
}

export async function fetchShelves(): Promise<Shelf[]> {
  const res = await apiClient.get<Record<string, unknown>[]>("shelves/index.php");
  return res.success && res.data ? res.data.map(mapApiShelf) : [];
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await apiClient.get<Record<string, unknown>[]>("categories/index.php");
  return res.success && res.data ? res.data.map(mapApiCategory) : [];
}

export async function fetchBooks(): Promise<Book[]> {
  const api = await fetchBooksFromApi();
  return api ?? [];
}

export async function fetchBooksFromApi(): Promise<Book[] | null> {
  const res = await apiClient.get<Record<string, unknown>[]>("books/index.php");
  return res.success && res.data ? res.data.map(mapApiBook) : null;
}

export async function fetchBook(id: string): Promise<Book | null> {
  const res = await apiClient.get<Record<string, unknown>[]>(
    `books/index.php?id=${encodeURIComponent(id)}`
  );
  return res.success && res.data?.length ? mapApiBook(res.data[0]) : null;
}

export async function createBook(
  book: Omit<Book, "id">
): Promise<{ success: boolean; message?: string; book?: Book }> {
  const res = await apiClient.post<Record<string, unknown>>("books/index.php", book);
  return {
    success: res.success,
    message: res.message,
    book: res.data ? mapApiBook(res.data) : undefined,
  };
}

export async function updateBook(
  book: Book
): Promise<{ success: boolean; message?: string; book?: Book }> {
  const res = await apiClient.put<Record<string, unknown>>("books/index.php", book);
  return {
    success: res.success,
    message: res.message,
    book: res.data ? mapApiBook(res.data) : undefined,
  };
}

export async function deleteBook(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete("books/index.php", { id });
  return { success: res.success, message: res.message };
}

export type CategoryInput = {
  dbId?: number;
  kode: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
};

export async function createCategory(
  data: CategoryInput
): Promise<{ success: boolean; message?: string; category?: Category }> {
  const res = await apiClient.post<Record<string, unknown>>("categories/index.php", data);
  return {
    success: res.success,
    message: res.message,
    category: res.data ? mapApiCategory(res.data) : undefined,
  };
}

export async function updateCategory(
  data: CategoryInput
): Promise<{ success: boolean; message?: string; category?: Category }> {
  const res = await apiClient.put<Record<string, unknown>>("categories/index.php", {
    ...data,
    id: data.dbId,
  });
  return {
    success: res.success,
    message: res.message,
    category: res.data ? mapApiCategory(res.data) : undefined,
  };
}

export async function deleteCategory(
  category: { id: string; dbId?: number }
): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete("categories/index.php", { id: category.dbId });
  return { success: res.success, message: res.message };
}

export type ShelfInput = {
  dbId?: number;
  kode: string;
  name: string;
  location?: string;
  floor?: number;
  capacity?: number;
  categories?: string[];
};

export async function createShelf(
  data: ShelfInput
): Promise<{ success: boolean; message?: string; shelf?: Shelf }> {
  const res = await apiClient.post<Record<string, unknown>>("shelves/index.php", data);
  return {
    success: res.success,
    message: res.message,
    shelf: res.data ? mapApiShelf(res.data) : undefined,
  };
}

export async function updateShelf(
  data: ShelfInput
): Promise<{ success: boolean; message?: string; shelf?: Shelf }> {
  const res = await apiClient.put<Record<string, unknown>>("shelves/index.php", {
    ...data,
    id: data.dbId,
  });
  return {
    success: res.success,
    message: res.message,
    shelf: res.data ? mapApiShelf(res.data) : undefined,
  };
}

export async function deleteShelf(
  shelf: { id: string; dbId?: number }
): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete("shelves/index.php", { id: shelf.dbId });
  return { success: res.success, message: res.message };
}
