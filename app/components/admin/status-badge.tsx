import { Badge } from "~/components/ui/badge";

const listingStatusVariants: Record<string, string> = {
  active: "default",
  draft: "secondary",
  pending_review: "caution",
  inactive: "secondary",
  sold: "success",
  expired: "caution",
  rejected: "destructive",
  suspended: "destructive",
};

const orderStatusVariants: Record<string, string> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "default",
  delivered: "success",
  completed: "success",
  cancelled: "destructive",
  disputed: "caution",
};

const payoutStatusVariants: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  completed: "success",
  failed: "destructive",
};

const userRoleVariants: Record<string, string> = {
  admin: "destructive",
  seller: "default",
  buyer: "secondary",
  listing_review_officer: "default",
  seller_verification_officer: "default",
  listing_review_and_verification_officer: "default",
  finance_officer: "default",
  support_officer: "default",
  auditor: "default",
};

export function ListingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={listingStatusVariants[status] as never} className="capitalize">
      {status}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={orderStatusVariants[status] as never} className="capitalize">
      {status}
    </Badge>
  );
}

export function PayoutStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={payoutStatusVariants[status] as never} className="capitalize">
      {status}
    </Badge>
  );
}

export function UserRoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={userRoleVariants[role] as never} className="capitalize">
      {role}
    </Badge>
  );
}

export function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge variant="success">Verified</Badge>
  ) : (
    <Badge variant="secondary">Unverified</Badge>
  );
}
