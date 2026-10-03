"use client";

import React from "react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Truck, CheckCircle, Clock, PackageCheck } from "lucide-react";

export default function ShipModeFulfillmentCard({ shipModes = [], kpi }) {
  // Use real ship mode data from ARDI-17
  const defaultModes = [
    { ship_mode: "Standard Class", order_count: 30775, avg_shipping_days: 5.0 },
    { ship_mode: "Second Class", order_count: 10309, avg_shipping_days: 3.2 },
    { ship_mode: "First Class", order_count: 7505, avg_shipping_days: 2.2 },
    { ship_mode: "Same Day", order_count: 2701, avg_shipping_days: 0.0 },
  ];

  const modes = shipModes && shipModes.length > 0 ? shipModes : defaultModes;
  const totalShipOrders = modes.reduce((sum, m) => sum + (m.order_count || 0), 0) || 1;

  const totalShippingCost = kpi?.total_shipping_cost ? formatCurrency(kpi.total_shipping_cost) : "$1.35M";
  const avgShippingCost = kpi?.avg_shipping_cost
    ? formatCurrency(kpi.avg_shipping_cost)
    : kpi?.total_orders
    ? formatCurrency((kpi?.total_shipping_cost || 0) / kpi.total_orders)
    : "$26.37";

  return (
    <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between z-10">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Ship Mode Fulfillment
          </h2>
          <span className="text-[11px] text-zinc-400 font-medium">
            4 Global Transit Channels
          </span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#7C69EF]">
          <Truck className="h-4 w-4" />
        </div>
      </div>

      {/* Middle: 4 Ship Mode Progress Cards */}
      <div className="my-3 space-y-2 z-10">
        {modes.map((mode, idx) => {
          const pct = Math.round(((mode.order_count || 0) / totalShipOrders) * 100);
          return (
            <div
              key={idx}
              className="p-2 rounded-2xl bg-white/80 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/30 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#7C69EF]" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {mode.ship_mode}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-zinc-900 dark:text-white">
                    {formatNumber(mode.order_count)}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">
                    ({pct}%)
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {mode.avg_shipping_days}d SLA
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Fulfillment Financials */}
      <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 z-10">
        <div>
          <span>Total Freight: </span>
          <strong className="text-zinc-800 dark:text-zinc-200">{totalShippingCost}</strong>
        </div>
        <div>
          <span>Avg / Order: </span>
          <strong className="text-zinc-800 dark:text-zinc-200">{avgShippingCost}</strong>
        </div>
      </div>
    </div>
  );
}
