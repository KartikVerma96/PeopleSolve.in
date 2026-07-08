"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Heart, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ICON_STROKE } from "@/lib/icon-style";
import { createPaymentOrder, verifyPayment } from "@/lib/api";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
};

type TipModalProps = {
  open: boolean;
  onClose: () => void;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail?: string;
  toUserId: string;
  toUserName: string;
  threadId?: string;
};

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function TipModal({
  open,
  onClose,
  fromUserId,
  fromUserName,
  fromUserEmail,
  toUserId,
  toUserName,
  threadId,
}: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amount = isCustom ? Number(customAmount) || 0 : (selectedAmount ?? 0);
  const platformFee = Math.round(amount * 0.1);
  const helperGets = amount - platformFee;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (amount < 1) {
      setError("Minimum amount is ₹1");
      return;
    }
    if (amount > 10000) {
      setError("Maximum amount is ₹10,000");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // Create order on backend
      const order = await createPaymentOrder({
        fromUserId,
        toUserId,
        threadId,
        amountInr: amount,
        note: note.trim() || undefined,
      });

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PeopleSolve",
        description: `Tip for ${toUserName}`,
        order_id: order.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            await verifyPayment({
              paymentId: order.paymentId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              onClose();
            }, 3000);
          } catch {
            setError("Payment verification failed. Contact support.");
          }
          setLoading(false);
        },
        prefill: {
          name: fromUserName,
          email: fromUserEmail,
        },
        theme: { color: "#32cd32" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedAmount(50);
    setCustomAmount("");
    setIsCustom(false);
    setNote("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-3 top-[5%] z-[9999] mx-auto max-w-md rounded-2xl border border-border/80 bg-card p-4 shadow-2xl dark:border-white/10 dark:bg-zinc-900 sm:inset-x-4 sm:top-[10%] sm:p-6"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" strokeWidth={ICON_STROKE} />
            </button>

            {success ? (
              /* Success state */
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
                  <Heart className="size-8 text-primary" strokeWidth={ICON_STROKE} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Thank you!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ₹{amount} sent to {toUserName}. You&apos;re awesome!
                  </p>
                </div>
              </div>
            ) : (
              /* Payment form */
              <>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15">
                    <Coffee className="size-5 text-amber-600 dark:text-amber-400" strokeWidth={ICON_STROKE} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Buy {toUserName} a Coffee
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Say thanks for their help
                    </p>
                  </div>
                </div>

                {/* Amount selection */}
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-foreground">Select amount</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setIsCustom(false);
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                          !isCustom && selectedAmount === amt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground hover:border-primary/40 dark:border-white/10",
                        )}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustom(true)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                        isCustom
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 dark:border-white/10",
                      )}
                    >
                      Custom
                    </button>
                    {isCustom && (
                      <div className="relative flex-1">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          min={1}
                          max={10000}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="h-9 pl-7 text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4">
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 200))}
                    placeholder="Add a thank you note (optional)"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Fee breakdown */}
                {amount > 0 && (
                  <div className="mt-4 space-y-1 rounded-xl bg-muted/50 p-3 text-xs dark:bg-white/[0.04]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tip amount</span>
                      <span className="font-medium text-foreground">₹{amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (10%)</span>
                      <span className="text-muted-foreground">-₹{platformFee}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1 dark:border-white/10">
                      <span className="font-medium text-foreground">{toUserName} gets</span>
                      <span className="font-bold text-primary">₹{helperGets}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}

                {/* Pay button */}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={amount < 1 || loading}
                  className="btn-shiny mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm disabled:pointer-events-none disabled:opacity-50"
                >
                  <Sparkles className="size-4" strokeWidth={ICON_STROKE} />
                  {loading ? "Processing..." : `Pay ₹${amount}`}
                </button>

                <p className="mt-3 text-center text-[10px] text-muted-foreground">
                  Powered by Razorpay · Secure UPI, Card & Netbanking
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
