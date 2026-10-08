import type { FulfilmentStatus, OrderStatus } from './types';

const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['placed', 'cancelled'],
  placed: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['processing', 'disputed', 'refunded'],
  processing: ['partially_fulfilled', 'fulfilled', 'disputed'],
  partially_fulfilled: ['fulfilled', 'disputed'],
  fulfilled: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'refunded'],
  refunded: [],
};

const ALLOWED_FULFILMENT_TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'dispatched', 'cancelled'],
  ready_for_pickup: ['dispatched', 'in_transit', 'delivered'],
  dispatched: ['in_transit', 'delivered', 'disputed'],
  in_transit: ['delivered', 'disputed'],
  delivered: ['accepted', 'rejected', 'disputed'],
  accepted: [],
  rejected: ['disputed', 'cancelled'],
  cancelled: [],
  disputed: ['accepted', 'rejected', 'cancelled'],
};

export class OrderStateMachine {
  /**
   * Checks whether an order can transition from current to target status.
   */
  static canTransitionOrder(current: OrderStatus, target: OrderStatus): boolean {
    const allowed = ALLOWED_ORDER_TRANSITIONS[current];
    return !!allowed && allowed.includes(target);
  }

  /**
   * Checks whether a fulfilment can transition from current to target status.
   */
  static canTransitionFulfilment(current: FulfilmentStatus, target: FulfilmentStatus): boolean {
    const allowed = ALLOWED_FULFILMENT_TRANSITIONS[current];
    return !!allowed && allowed.includes(target);
  }

  /**
   * Validates whether an order can transition from current to target status.
   * Throws an error if the transition is prohibited.
   */
  static validateOrderTransition(current: OrderStatus, target: OrderStatus): void {
    if (!this.canTransitionOrder(current, target)) {
      throw new Error(`ILLEGAL_ORDER_TRANSITION: Cannot transition order from "${current}" to "${target}".`);
    }
  }

  /**
   * Validates whether a fulfillment can transition from current to target status.
   * Throws an error if the transition is prohibited.
   */
  static validateFulfilmentTransition(current: FulfilmentStatus, target: FulfilmentStatus): void {
    if (!this.canTransitionFulfilment(current, target)) {
      throw new Error(`ILLEGAL_FULFILMENT_TRANSITION: Cannot transition fulfilment from "${current}" to "${target}".`);
    }
  }

  /**
   * Derives composite parent order status from the statuses of its individual seller fulfillments.
   */
  static deriveCompositeOrderStatus(fulfilmentStatuses: FulfilmentStatus[]): OrderStatus {
    if (fulfilmentStatuses.length === 0) return 'placed';

    const allAccepted = fulfilmentStatuses.every((s) => s === 'accepted');
    if (allAccepted) return 'completed';

    const allDelivered = fulfilmentStatuses.every((s) => s === 'delivered' || s === 'accepted');
    if (allDelivered) return 'delivered';

    const anyDisputed = fulfilmentStatuses.some((s) => s === 'disputed');
    if (anyDisputed) return 'disputed';

    const anyFulfilled = fulfilmentStatuses.some((s) => s === 'delivered' || s === 'dispatched' || s === 'in_transit');
    if (anyFulfilled) return 'partially_fulfilled';

    return 'processing';
  }
}
