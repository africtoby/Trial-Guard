/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  isTrial: boolean;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'canceled';
}
