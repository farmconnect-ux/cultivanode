import type { PaymentProvider } from './types';

export interface PaymentInitiationResult {
  paymentReference: string;
  authorizationUrl: string;
  provider: PaymentProvider;
  amountKobo: number;
}

export interface PaymentVerificationResult {
  successful: boolean;
  paymentReference: string;
  amountKobo: number;
  paidAt: number;
  gatewayResponse: Record<string, unknown>;
}

export interface PaymentGatewayAdapter {
  initiatePayment(orderId: string, amountKobo: number, customerEmail: string): Promise<PaymentInitiationResult>;
  verifyPayment(paymentReference: string): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}

export class PaystackAdapter implements PaymentGatewayAdapter {
  constructor(private secretKey: string) {}

  async initiatePayment(orderId: string, amountKobo: number, customerEmail: string): Promise<PaymentInitiationResult> {
    const reference = `PSTK_${orderId}_${Date.now()}`;
    return {
      paymentReference: reference,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
      provider: 'paystack',
      amountKobo,
    };
  }

  async verifyPayment(paymentReference: string): Promise<PaymentVerificationResult> {
    return {
      successful: true,
      paymentReference,
      amountKobo: 0,
      paidAt: Date.now(),
      gatewayResponse: { status: 'success', reference: paymentReference },
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    // In production, compute HMAC SHA512 of payload with secret
    return signature.length > 0;
  }
}

export class FlutterwaveAdapter implements PaymentGatewayAdapter {
  constructor(private secretKey: string) {}

  async initiatePayment(orderId: string, amountKobo: number, customerEmail: string): Promise<PaymentInitiationResult> {
    const reference = `FLW_${orderId}_${Date.now()}`;
    return {
      paymentReference: reference,
      authorizationUrl: `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`,
      provider: 'flutterwave',
      amountKobo,
    };
  }

  async verifyPayment(paymentReference: string): Promise<PaymentVerificationResult> {
    return {
      successful: true,
      paymentReference,
      amountKobo: 0,
      paidAt: Date.now(),
      gatewayResponse: { status: 'successful', tx_ref: paymentReference },
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    return signature === secret;
  }
}

export class MockPaymentAdapter implements PaymentGatewayAdapter {
  private initiatedAmountKobo = 5000000;

  async initiatePayment(orderId: string, amountKobo: number, _customerEmail: string): Promise<PaymentInitiationResult> {
    this.initiatedAmountKobo = amountKobo;
    const reference = `MOCK_${orderId}_${Date.now()}`;
    return {
      paymentReference: reference,
      authorizationUrl: `/mock-checkout?ref=${reference}`,
      provider: 'test_adapter',
      amountKobo,
    };
  }

  async verifyPayment(paymentReference: string): Promise<PaymentVerificationResult> {
    return {
      successful: true,
      paymentReference,
      amountKobo: this.initiatedAmountKobo,
      paidAt: Date.now(),
      gatewayResponse: { test: true, status: 'success' },
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }
}
