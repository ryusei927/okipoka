"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

type CardInfo = {
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

function formatBrand(brand: string): string {
  switch (brand.toUpperCase()) {
    case "VISA":
      return "Visa";
    case "MASTERCARD":
      return "Mastercard";
    case "AMERICAN_EXPRESS":
      return "Amex";
    case "JCB":
      return "JCB";
    case "DISCOVER":
      return "Discover";
    case "DISCOVER_DINERS":
      return "Diners";
    case "CHINA_UNIONPAY":
      return "UnionPay";
    default:
      return "カード";
  }
}

export function PaymentMethodRow() {
  const [card, setCard] = useState<CardInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/member/payment-method")
      .then((res) => (res.ok ? res.json() : { card: null }))
      .then((data) => {
        if (active) setCard(data?.card ?? null);
      })
      .catch(() => {
        if (active) setCard(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
        <span className="text-sm text-gray-500">お支払い方法</span>
        <span className="h-3.5 w-24 animate-pulse rounded-sm bg-gray-100" />
      </div>
    );
  }

  if (!card) return null;

  const exp =
    card.expMonth != null && card.expYear != null
      ? `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`
      : null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-sm text-gray-500">お支払い方法</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <CreditCard className="h-4 w-4 text-gray-400" />
        {formatBrand(card.brand)}
        <span className="text-gray-400">•••• {card.last4}</span>
        {exp && <span className="ml-1 text-[11px] text-gray-400">({exp})</span>}
      </span>
    </div>
  );
}
