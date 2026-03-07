/**
 * Eventos de Mensageria
 *
 * Centraliza todos os nomes de eventos usados no sistema.
 * Evita typos e facilita manutenção.
 */

export const MESSAGING_EVENTS = {
  // Eventos de Empréstimos
  LOAN_CREATED: 'loan.created',
  LOAN_RETURNED: 'loan.returned',
  LOAN_RENEWED: 'loan.renewed',
  LOAN_OVERDUE: 'loan.overdue',

  // Eventos de Reservas
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_FULFILLED: 'reservation.fulfilled',

  // Eventos de Multas
  FINE_CREATED: 'fine.created',
  FINE_PAID: 'fine.paid',
  FINE_CANCELLED: 'fine.cancelled',

  // Eventos de Notificações
  EMAIL_SEND: 'email.send',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

/**
 * Payloads dos Eventos
 * Define a estrutura de dados de cada evento
 */

export interface LoanCreatedEvent {
  loanId: number;
  userId: number;
  bookId: number;
  bookTitle: string;
  userName: string;
  userEmail: string;
  loanDate: Date;
  dueDate: Date;
}

export interface LoanReturnedEvent {
  loanId: number;
  userId: number;
  bookId: number;
  bookTitle: string;
  returnDate: Date;
  wasOverdue: boolean;
  daysOverdue?: number;
  fineAmount?: number;
}

export interface LoanRenewedEvent {
  loanId: number;
  userId: number;
  userEmail: string;
  userName: string;
  bookTitle: string;
  newDueDate: Date;
  renewalCount: number;
}

export interface LoanOverdueEvent {
  loanId: number;
  userId: number;
  userEmail: string;
  userName: string;
  bookId: number;
  bookTitle: string;
  dueDate: Date;
  daysOverdue: number;
}

export interface ReservationCreatedEvent {
  reservationId: number;
  userId: number;
  bookId: number;
  bookTitle: string;
  queuePosition: number;
}

export interface ReservationConfirmedEvent {
  reservationId: number;
  userId: number;
  userEmail: string;
  userName: string;
  bookId: number;
  bookTitle: string;
}

export interface FineCreatedEvent {
  fineId: number;
  userId: number;
  userEmail: string;
  userName: string;
  loanId: number;
  amount: number;
  reason: string;
}
