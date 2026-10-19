import { apiClient } from "./apiClient";
import {
  shelves as fallbackShelves,
  categories as fallbackCategories,
  books as fallbackBooks,
  type Shelf,
  type Category,
  type Book,
} from "../data/libraryData";

function mapApiShelf(row: Record<string, unknown>): Shelf {
  const categoriesStr = (row.categories as string) || "";
  return {
    id: row.kode as string,
    name: row.name as string,
    location: row.location as string,
    floor: Number(row.floor) || 1,
    categories: categoriesStr ? categoriesStr.split(",") : [],
    capacity: Number(row.capacity) || 0,
    occupied: 0,
  };
}

function mapApiCategory(row: Record<string, unknown>): Category {
  return {
    id: row.kode as string,
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
    categoryId: row.category_id as string,
    shelfId: row.shelf_id as string,
    shelfPosition: (row.shelf_position as string) || "",
    cover: (row.cover as string) || "",
    rating: Number(row.rating) || 0,
    year: Number(row.published_year) || 0,
    pages: Number(row.pages) || 0,
    isbn: (row.isbn as string) || "",
    available: availableStock > 0,
    stock: availableStock,
    description: (row.description as string) || "",
    publisher: (row.publisher as string) || "",
    recommended: Boolean(row.recommended),
  };
}

export async function fetchShelves(): Promise<Shelf[]> {
  try {
    const res = await apiClient.get<Record<string, unknown>[]>("shelves/index.php");
    if (res.success && res.data) {
      const shelves = res.data.map(mapApiShelf);
      return shelves;
    }
    return fallbackShelves;
  } catch {
    return fallbackShelves;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await apiClient.get<Record<string, unknown>[]>("categories/index.php");
    if (res.success && res.data) {
      return res.data.map(mapApiCategory);
    }
    return fallbackCategories;
  } catch {
    return fallbackCategories;
  }
}

export async function fetchBooks(): Promise<Book[]> {
  const api = await fetchBooksFromApi();
  if (api) return api;
  return fallbackBooks.map((b) => ({ ...b, recommended: false }));
}

export async function fetchBooksFromApi(): Promise<Book[] | null> {
  try {
    const res = await apiClient.get<Record<string, unknown>[]>("books/index.php");
    if (res.success && res.data) {
      return res.data.map(mapApiBook);
    }
    return null;
  } catch {
    return null;
  }
}

export async function createBook(book: Omit<Book, "id">): Promise<Book | null> {
  try {
    const res = await apiClient.post<{ id: number }>("books/index.php", book);
    if (res.success && res.data) {
      return { ...book, id: String(res.data.id) } as Book;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateBook(book: Book): Promise<boolean> {
  try {
    const res = await apiClient.put("books/index.php", book);
    return res.success;
  } catch {
    return false;
  }
}

export async function deleteBook(id: string): Promise<boolean> {
  try {
    const res = await apiClient.delete("books/index.php", { id });
    return res.success;
  } catch {
    return false;
  }
}
