import type { CreateVisitInput, ScorecardInput } from './schemas';
import type {
  PublicationReason,
  PublicationState,
  PublicVisitFilters,
  ReviewAggregate,
  ScoreValues,
} from './types';

export type MemberRole = 'member' | 'admin';

export interface MemberRecord {
  id: string;
  authUserId: string;
  email: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  societyTitle: string | null;
  memberNumber: number;
  bio: string;
  favoriteCuisine: string | null;
  role: MemberRole;
}

export interface PublicMemberSummary {
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  societyTitle: string | null;
  memberNumber: number;
  bio: string;
  favoriteCuisine: string | null;
  contributions: {
    publishedVisits: number;
    scorecards: number;
  };
}

export interface VisitRecord {
  id: string;
  slug: string;
  restaurantId: string;
  createdBy: string | null;
  visitedAt: string;
  quorum: number;
  publicationState: PublicationState;
  publicationReason: PublicationReason;
  publishedAt: string | null;
  publishedBy: string | null;
  hiddenAt: string | null;
  hiddenBy: string | null;
  legacyReviewId: string | null;
  legacyPayload: Record<string, unknown> | null;
}

export interface ScorecardRecord extends ScorecardInput {
  id: string;
  visitId: string;
  memberId: string;
}

export interface PublicRestaurantSummary {
  slug: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  address: string | null;
  priceBand: string | null;
}

export interface PublicPhoto {
  id: string;
  url: string;
  position: number;
}

export interface PublicComment {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  comment: string;
  dish: string | null;
  scores: ScoreValues;
  overall: number;
}

export type HistoricalScoreValues = Record<keyof ScoreValues, number | null>;

export interface HistoricalReview {
  legacyReviewId: string;
  payload: Record<string, unknown>;
  scores: HistoricalScoreValues;
  overall: number | null;
}

export interface PublicVisitSummary extends ReviewAggregate {
  id: string;
  slug: string;
  restaurant: PublicRestaurantSummary;
  visitedAt: string;
  publishedAt: string | null;
  coverPhotoUrl: string | null;
}

export interface PublicVisitDetail extends PublicVisitSummary {
  photos: PublicPhoto[];
  comments: PublicComment[];
  historical: HistoricalReview | null;
}

export interface PendingVisit {
  id: string;
  slug: string;
  restaurantName: string;
  visitedAt: string;
  participantCount: number;
  quorum: number;
  hasSubmitted: boolean;
  publicationState: PublicationState;
}

export interface RecentPublishedVisit {
  id: string;
  slug: string;
  restaurantName: string;
  visitedAt: string;
  participantCount: number;
  publishedAt: string | null;
}

export interface AdminVisitSummary {
  id: string;
  slug: string;
  restaurantName: string;
  visitedAt: string;
  participantCount: number;
  quorum: number;
  publicationState: PublicationState;
}

export interface VisitDeletionTarget {
  id: string;
  restaurantId: string;
  participantCount: number;
  photoPathnames: string[];
}

export interface VisitReviewWorkspace {
  id: string;
  restaurantName: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  visitedAt: string;
  participantCount: number;
  quorum: number;
  publicationState: PublicationState;
  createdBy: string | null;
  ownScorecard: ScorecardInput | null;
  photos: PublicPhoto[];
}

export interface PhotoInput {
  url: string;
  pathname: string;
  contentType: 'image/webp';
  sizeBytes: number;
}

export interface PhotoRecord extends PhotoInput {
  id: string;
  visitId: string;
  uploadedBy: string | null;
  position: number;
}

export type PublicationEventAction = 'quorum_publish' | 'publish_early' | 'hide' | 'republish';

export interface PublicationEventInput {
  visitId: string;
  actorId: string | null;
  action: PublicationEventAction;
  participantCount: number;
}

export interface SubmissionResult {
  visitId: string;
  publicationState: PublicationState;
  publicationReason: PublicationReason;
  participantCount: number;
  aggregate: ReviewAggregate;
  publicationChanged: boolean;
}

export interface AtomicScorecardSubmissionInput {
  visitId: string;
  memberId: string;
  scorecard: ScorecardInput;
}

export interface AtomicPublicationChangeInput {
  visitId: string;
  expectedPublicationState: PublicationState;
  state: PublicationState;
  reason: PublicationReason;
  actorId: string;
  action: Exclude<PublicationEventAction, 'quorum_publish'>;
}

export interface ReviewRepository {
  findMemberByAuthUserId(authUserId: string): Promise<MemberRecord | null>;
  findMemberById(memberId: string): Promise<MemberRecord | null>;
  findVisitById(visitId: string): Promise<VisitRecord | null>;
  createVisit(actorId: string, input: CreateVisitInput): Promise<VisitRecord>;
  upsertScorecard(visitId: string, memberId: string, input: ScorecardInput): Promise<void>;
  countScorecards(visitId: string): Promise<number>;
  updatePublication(
    visitId: string,
    state: PublicationState,
    reason: PublicationReason,
    actorId: string | null,
  ): Promise<VisitRecord>;
  recordPublicationEvent(input: PublicationEventInput): Promise<void>;
  submitScorecardAtomically(input: AtomicScorecardSubmissionInput): Promise<SubmissionResult>;
  changePublicationAtomically(input: AtomicPublicationChangeInput): Promise<VisitRecord>;
  attachPhoto(visitId: string, actorId: string, input: PhotoInput): Promise<void>;
  findPhotoById(photoId: string): Promise<PhotoRecord | null>;
  findPhotoByPathname(pathname: string): Promise<PhotoRecord | null>;
  deletePhoto(visitId: string, photoId: string, actorId: string): Promise<PhotoRecord | null>;
  countVisitPhotos(visitId: string): Promise<number>;
  prepareVisitDeletion(
    visitId: string,
    actorId: string,
    expectedParticipantCount: number,
  ): Promise<VisitDeletionTarget | null>;
  deleteVisit(
    visitId: string,
    actorId: string,
    expectedPhotoPathnames: string[],
  ): Promise<boolean>;
  listPublicVisits(filters: PublicVisitFilters): Promise<PublicVisitSummary[]>;
  listRecentPublishedVisits(limit: number): Promise<RecentPublishedVisit[]>;
  listVisitsForAdministration(actorId: string): Promise<AdminVisitSummary[]>;
  listVisitsForManagement(actorId: string): Promise<AdminVisitSummary[]>;
  getPublicVisitBySlug(slug: string): Promise<PublicVisitDetail | null>;
  listPublicMembers(): Promise<PublicMemberSummary[]>;
  listPendingVisitsForMember(memberId: string): Promise<PendingVisit[]>;
  listVisitsInFormationForMember(memberId: string): Promise<PendingVisit[]>;
  getVisitReviewWorkspace(visitId: string, memberId: string): Promise<VisitReviewWorkspace | null>;
}
