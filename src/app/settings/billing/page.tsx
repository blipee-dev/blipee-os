"use client";

import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, TrendingUp, Calendar } from "lucide-react";

export default function BillingSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Billing & Subscription
        </h1>
        <p className="text-[#616161] dark:text-[#757575]">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Current Plan */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
          <p className="text-3xl font-bold mb-1">Enterprise</p>
          <p className="text-white/80">$299/month</p>
        </div>

        {/* Usage */}
        <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Usage</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">85%</p>
          <p className="text-sm text-[#616161] dark:text-[#757575]">850k / 1M requests</p>
        </div>

        {/* Next Payment */}
        <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Next Payment</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Oct 1, 2024</p>
          <p className="text-sm text-[#616161] dark:text-[#757575]">Auto-renewal</p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05] mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Method
        </h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212121] rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
              <CreditCard className="w-6 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                •••• •••• •••• 4242
              </p>
              <p className="text-xs text-[#616161] dark:text-[#757575]">
                Expires 12/24
              </p>
            </div>
          </div>
          <button className="text-purple-500 hover:text-purple-600 text-sm font-medium">
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Billing History
        </h2>
        <div className="space-y-3">
          {[
            { date: "Sep 1, 2024", amount: "$299.00", status: "Paid" },
            { date: "Aug 1, 2024", amount: "$299.00", status: "Paid" },
            { date: "Jul 1, 2024", amount: "$299.00", status: "Paid" },
          ].map((invoice, index) => (
            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.date}
                </p>
                <p className="text-xs text-[#616161] dark:text-[#757575]">
                  {invoice.amount}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  {invoice.status}
                </span>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}