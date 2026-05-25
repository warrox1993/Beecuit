/**
 * CheckoutTrustBadges — Au Fil des Saveurs (Phase 4G).
 *
 * 3 small trust signals shown under the OrderSummary on the checkout page.
 */
export function CheckoutTrustBadges() {
  return (
    <ul className="text-warm-brown/80 mt-4 space-y-2 text-[0.78rem]">
      <li className="flex items-center gap-2">
        <LockIcon className="text-honey-dark h-3.5 w-3.5" />
        <span>Paiement sécurisé Stripe</span>
      </li>
      <li className="flex items-center gap-2">
        <TruckIcon className="text-honey-dark h-3.5 w-3.5" />
        <span>Livraison 24h en Belgique</span>
      </li>
      <li className="flex items-center gap-2">
        <HeartIcon className="text-honey-dark h-3.5 w-3.5" />
        <span>Sans frais cachés, TVA incluse</span>
      </li>
    </ul>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="2" y="7" width="11" height="10" rx="1" />
      <path d="M13 10 H18 L22 14 V17 H13 Z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 20 S 4 14 4 9 a4 4 0 0 1 8 -1 a4 4 0 0 1 8 1 c0 5 -8 11 -8 11 Z" />
    </svg>
  );
}
