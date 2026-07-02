import { Book, books as staticBooks } from "../data/libraryData";
import { loadLoans } from "./loanUtils";

/**
 * Calculate real-time availability for books based on active loans
 * Returns books array with updated availability status and stock
 */
export function getAvailableBooks(): Book[] {
  const allLoans = loadLoans();
  const activeLoans = allLoans.filter((loan) => loan.status === "active");
  
  // Create a map of borrowed book IDs
  const borrowedBookIds = new Map<string, number>();
  activeLoans.forEach((loan) => {
    borrowedBookIds.set(loan.bookId, (borrowedBookIds.get(loan.bookId) || 0) + 1);
  });
  
  // Return books with updated availability based on actual loans
  return staticBooks.map((book) => {
    const borrowCount = borrowedBookIds.get(book.id) || 0;
    const currentStock = Math.max(0, book.stock - borrowCount);
    
    return {
      ...book,
      available: currentStock > 0,
      stock: currentStock,
    };
  });
}

/**
 * Get a single book with current availability
 */
export function getBookWithAvailability(bookId: string): Book | undefined {
  return getAvailableBooks().find((b) => b.id === bookId);
}

/**
 * Count how many copies of a book are currently borrowed
 */
export function getBorrowCount(bookId: string): number {
  const allLoans = loadLoans();
  const activeLoans = allLoans.filter((loan) => loan.status === "active");
  return activeLoans.filter((loan) => loan.bookId === bookId).length;
}

/**
 * Check if a book can be borrowed (has available stock)
 */
export function canBorrowBook(bookId: string): boolean {
  const book = getBookWithAvailability(bookId);
  return book ? book.available && book.stock > 0 : false;
}

/**
 * Get total available count across all books
 */
export function getTotalAvailableBooks(): number {
  return getAvailableBooks().filter((b) => b.available).length;
}

/**
 * Get available count for a specific category
 */
export function getAvailableBooksInCategory(categoryId: string): number {
  return getAvailableBooks().filter((b) => b.categoryId === categoryId && b.available).length;
}
