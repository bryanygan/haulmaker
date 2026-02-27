"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Quote, UpdateQuotePayload } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsCardProps {
  quote: Quote;
  onUpdate: (data: UpdateQuotePayload) => Promise<void>;
}

export function SettingsCard({ quote, onUpdate }: SettingsCardProps) {
  const [exchangeRate, setExchangeRate] = useState(String(quote.exchangeRate));
  const [fixedFeeUsd, setFixedFeeUsd] = useState(String(quote.fixedFeeUsd));
  const [shippingPerKgUsd, setShippingPerKgUsd] = useState(String(quote.shippingPerKgUsd));
  const [insuranceRate, setInsuranceRate] = useState(String(quote.insuranceRate));
  const [haulFeeUsd, setHaulFeeUsd] = useState(String(quote.haulFeeUsd));
  const [customerName, setCustomerName] = useState(quote.customerName);
  const [customerHandle, setCustomerHandle] = useState(quote.customerHandle || "");
  const [orderId, setOrderId] = useState(quote.orderId || "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when quote changes from server
  useEffect(() => {
    setExchangeRate(String(quote.exchangeRate));
    setFixedFeeUsd(String(quote.fixedFeeUsd));
    setShippingPerKgUsd(String(quote.shippingPerKgUsd));
    setInsuranceRate(String(quote.insuranceRate));
    setHaulFeeUsd(String(quote.haulFeeUsd));
    setCustomerName(quote.customerName);
    setCustomerHandle(quote.customerHandle || "");
    setOrderId(quote.orderId || "");
  }, [quote]);

  const debouncedUpdate = useCallback(
    (data: UpdateQuotePayload) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdate(data), 500);
    },
    [onUpdate]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(field: string, value: string) {
    switch (field) {
      case "customerName":
        setCustomerName(value);
        debouncedUpdate({ customerName: value });
        break;
      case "customerHandle":
        setCustomerHandle(value);
        debouncedUpdate({ customerHandle: value });
        break;
      case "orderId":
        setOrderId(value);
        debouncedUpdate({ orderId: value });
        break;
      case "exchangeRate":
        setExchangeRate(value);
        if (parseFloat(value) > 0) debouncedUpdate({ exchangeRate: parseFloat(value) });
        break;
      case "fixedFeeUsd":
        setFixedFeeUsd(value);
        if (parseFloat(value) >= 0) debouncedUpdate({ fixedFeeUsd: parseFloat(value) });
        break;
      case "shippingPerKgUsd":
        setShippingPerKgUsd(value);
        if (parseFloat(value) >= 0) debouncedUpdate({ shippingPerKgUsd: parseFloat(value) });
        break;
      case "insuranceRate":
        setInsuranceRate(value);
        if (parseFloat(value) >= 0 && parseFloat(value) <= 1)
          debouncedUpdate({ insuranceRate: parseFloat(value) });
        break;
      case "haulFeeUsd":
        setHaulFeeUsd(value);
        if (parseFloat(value) >= 0) debouncedUpdate({ haulFeeUsd: parseFloat(value) });
        break;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Discord Handle</Label>
            <Input
              value={customerHandle}
              onChange={(e) => handleChange("customerHandle", e.target.value)}
              className="h-8 text-sm"
              placeholder="@handle"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Order ID</Label>
            <Input
              value={orderId}
              onChange={(e) => handleChange("orderId", e.target.value)}
              className="h-8 text-sm"
              placeholder="ZR-001"
            />
          </div>
        </div>

        <hr />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Exchange Rate (CNY/USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={exchangeRate}
              onChange={(e) => handleChange("exchangeRate", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fixed Fee (USD)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={fixedFeeUsd}
              onChange={(e) => handleChange("fixedFeeUsd", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Shipping ($/kg)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={shippingPerKgUsd}
              onChange={(e) => handleChange("shippingPerKgUsd", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Insurance Rate</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={insuranceRate}
              onChange={(e) => handleChange("insuranceRate", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Haul Fee (USD)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={haulFeeUsd}
              onChange={(e) => handleChange("haulFeeUsd", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
