import { clientsApi } from '@/api/clients.api';
import { professionalsApi } from '@/api/professionals.api';
import { Review } from '@/types';

export function reviewAuthorId(review: Review) {
  return review.reviewerId ?? review.clientId;
}

export function reviewAuthorName(review: Review, resolvedNames: Record<string, string>, fallback: string) {
  const id = reviewAuthorId(review);
  const resolved = id ? resolvedNames[id]?.trim() : undefined;
  return review.reviewerName?.trim() || review.clientName?.trim() || resolved || fallback;
}

export function professionalReviewAuthorName(
  review: Review,
  resolvedNames: Record<string, string>,
  fallback: string,
) {
  const id = review.reviewerId;
  const resolved = id ? resolvedNames[id]?.trim() : undefined;
  return review.reviewerName?.trim() || resolved || fallback;
}

export async function resolveClientReviewAuthorNames(reviews: Review[]) {
  const ids = Array.from(new Set(reviews.map(reviewAuthorId).filter((id): id is string => !!id)));
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const client = await clientsApi.getById(id);
        return [id, client.displayName ?? client.email ?? id] as const;
      } catch {
        return [id, ''] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export async function resolveProfessionalReviewAuthorNames(reviews: Review[]) {
  const ids = Array.from(new Set(reviews.map((review) => review.reviewerId).filter((id): id is string => !!id)));
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const professional = await professionalsApi.getById(id);
        return [id, professional.displayName ?? professional.headline?.split(' · ')[0] ?? professional.email ?? id] as const;
      } catch {
        return [id, ''] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
