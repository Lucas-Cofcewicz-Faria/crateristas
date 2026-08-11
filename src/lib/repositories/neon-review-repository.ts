import type {
  NeonQueryFunctionInTransaction,
  NeonQueryInTransaction,
  QueryRows,
} from '@neondatabase/serverless';
import type {
  AtomicPublicationChangeInput,
  AtomicScorecardSubmissionInput,
  HistoricalReview,
  MemberRecord,
  PendingVisit,
  PhotoInput,
  PhotoRecord,
  PublicationEventInput,
  PublicMemberSummary,
  PublicComment,
  PublicPhoto,
  PublicVisitDetail,
  PublicVisitSummary,
  ReviewRepository,
  SubmissionResult,
  VisitRecord,
} from '@/domain/reviews/repository';
import type { CreateVisitInput, ScorecardInput } from '@/domain/reviews/schemas';
import { SCORE_KEYS, type PublicationReason, type PublicationState, type PublicVisitFilters } from '@/domain/reviews/types';
import { getDb } from '@/lib/db';

export type ReviewSqlClient = ReturnType<typeof getDb>;
type Row = QueryRows<false>[number];
type TransactionFactory = (
  transaction: NeonQueryFunctionInTransaction<false, false>,
) => NeonQueryInTransaction[];

async function serializableTransaction(
  sql: ReviewSqlClient,
  factory: TransactionFactory,
): Promise<QueryRows<false>[]> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await sql.transaction(factory, { isolationLevel: 'Serializable' });
    } catch (error) {
      const serializationFailure = isRecord(error) && error.code === '40001';
      if (!serializationFailure || attempt === 3) throw error;
    }
  }
  throw new Error('Não foi possível concluir a transação serializável.');
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`Resposta inválida do banco: ${field}.`);
  return value;
}

function nullablePublicationReason(value: unknown): PublicationReason {
  if (value === null || value === 'quorum' || value === 'admin_override') return value;
  throw new Error('Resposta inválida do banco: publication_reason.');
}

function publicationState(value: unknown): PublicationState {
  if (value === 'private' || value === 'published' || value === 'hidden') return value;
  throw new Error('Resposta inválida do banco: publication_state.');
}

function numberValue(value: unknown, field: string): number {
  const result = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(result)) throw new Error(`Resposta inválida do banco: ${field}.`);
  return result;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 'true';
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  return requiredString(value, field);
}

function dateString(value: unknown, field: string): string {
  if (value instanceof Date) return value.toISOString();
  return requiredString(value, field);
}

function nullableDateString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  return dateString(value, field);
}

function recordValue(value: unknown, field: string): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Resposta inválida do banco: ${field}.`);
  }
  return value as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  return numberValue(value, field);
}

function publicPhotos(value: unknown): PublicPhoto[] {
  if (!Array.isArray(value)) throw new Error('Resposta inválida do banco: photos.');
  return value.map((photo) => {
    if (!isRecord(photo)) throw new Error('Resposta inválida do banco: photo.');
    return {
      id: requiredString(photo.id, 'photo.id'),
      url: requiredString(photo.url, 'photo.url'),
      position: numberValue(photo.position, 'photo.position'),
    };
  });
}

function publicComments(value: unknown): PublicComment[] {
  if (!Array.isArray(value)) throw new Error('Resposta inválida do banco: comments.');
  return value.map((comment) => {
    if (!isRecord(comment)) {
      throw new Error('Resposta inválida do banco: comment.');
    }
    return {
      memberId: requiredString(comment.memberId, 'comment.memberId'),
      displayName: requiredString(comment.displayName, 'comment.displayName'),
      avatarUrl: nullableString(comment.avatarUrl, 'comment.avatarUrl'),
      comment: requiredString(comment.comment, 'comment.comment'),
    };
  });
}

function historicalReview(legacyReviewId: unknown, legacyPayload: unknown): HistoricalReview | null {
  if (legacyReviewId === null || legacyReviewId === undefined) return null;
  const id = requiredString(legacyReviewId, 'legacy_review_id');
  const payload = recordValue(legacyPayload, 'legacy_payload');
  if (!payload) throw new Error('Resposta inválida do banco: legacy_payload.');
  const source = isRecord(payload.scores) ? payload.scores : payload;
  const scores = Object.fromEntries(SCORE_KEYS.map((key) => {
    const raw = key === 'waitTime' ? (source.waitTime ?? source.wait_time) : source[key];
    const score = typeof raw === 'number' && raw >= 0 && raw <= 10 ? raw : null;
    return [key, score];
  })) as HistoricalReview['scores'];
  const assessed = Object.values(scores).filter((score): score is number => score !== null);
  const overall = assessed.length === 0
    ? null
    : Math.round((assessed.reduce((sum, score) => sum + score, 0) / assessed.length + Number.EPSILON) * 10) / 10;
  return { legacyReviewId: id, payload, scores, overall };
}

function publicVisitDetailFromRow(row: Row): PublicVisitDetail {
  const participantCount = numberValue(row.participant_count, 'participant_count');
  const averages = participantCount === 0 ? null : {
    food: numberValue(row.average_food, 'average_food'),
    service: numberValue(row.average_service, 'average_service'),
    ambience: numberValue(row.average_ambience, 'average_ambience'),
    value: numberValue(row.average_value, 'average_value'),
    access: numberValue(row.average_access, 'average_access'),
    waitTime: numberValue(row.average_wait_time, 'average_wait_time'),
  };
  return {
    id: requiredString(row.id, 'id'),
    slug: requiredString(row.slug, 'slug'),
    restaurant: {
      slug: requiredString(row.restaurant_slug, 'restaurant_slug'),
      name: requiredString(row.restaurant_name, 'restaurant_name'),
      cuisine: requiredString(row.cuisine, 'cuisine'),
      neighborhood: requiredString(row.neighborhood, 'neighborhood'),
      city: requiredString(row.city, 'city'),
      address: nullableString(row.address, 'address'),
      priceBand: nullableString(row.price_band, 'price_band'),
    },
    visitedAt: dateString(row.visited_at, 'visited_at'),
    publishedAt: nullableDateString(row.published_at, 'published_at'),
    participantCount,
    averages,
    overall: nullableNumber(row.overall, 'overall'),
    coverPhotoUrl: nullableString(row.cover_photo_url, 'cover_photo_url'),
    photos: publicPhotos(row.photos),
    comments: publicComments(row.comments),
    historical: historicalReview(row.legacy_review_id, row.legacy_payload),
  };
}

function publicVisitSummaryFromRow(row: Row): PublicVisitSummary {
  const participantCount = numberValue(row.participant_count, 'participant_count');
  return {
    id: requiredString(row.id, 'id'),
    slug: requiredString(row.slug, 'slug'),
    restaurant: {
      slug: requiredString(row.restaurant_slug, 'restaurant_slug'),
      name: requiredString(row.restaurant_name, 'restaurant_name'),
      cuisine: requiredString(row.cuisine, 'cuisine'),
      neighborhood: requiredString(row.neighborhood, 'neighborhood'),
      city: requiredString(row.city, 'city'),
      address: nullableString(row.address, 'address'),
      priceBand: nullableString(row.price_band, 'price_band'),
    },
    visitedAt: dateString(row.visited_at, 'visited_at'),
    publishedAt: nullableDateString(row.published_at, 'published_at'),
    participantCount,
    averages: participantCount === 0 ? null : {
      food: numberValue(row.average_food, 'average_food'),
      service: numberValue(row.average_service, 'average_service'),
      ambience: numberValue(row.average_ambience, 'average_ambience'),
      value: numberValue(row.average_value, 'average_value'),
      access: numberValue(row.average_access, 'average_access'),
      waitTime: numberValue(row.average_wait_time, 'average_wait_time'),
    },
    overall: nullableNumber(row.overall, 'overall'),
    coverPhotoUrl: nullableString(row.cover_photo_url, 'cover_photo_url'),
  };
}

function publicMemberFromRow(row: Row): PublicMemberSummary {
  return {
    slug: requiredString(row.slug, 'slug'),
    displayName: requiredString(row.display_name, 'display_name'),
    avatarUrl: nullableString(row.avatar_url, 'avatar_url'),
    societyTitle: nullableString(row.society_title, 'society_title'),
    memberNumber: numberValue(row.member_number, 'member_number'),
    bio: requiredString(row.bio, 'bio'),
    favoriteCuisine: nullableString(row.favorite_cuisine, 'favorite_cuisine'),
    contributions: {
      publishedVisits: numberValue(row.published_visits, 'published_visits'),
      scorecards: numberValue(row.scorecard_count, 'scorecard_count'),
    },
  };
}

function pendingVisitFromRow(row: Row): PendingVisit {
  return {
    id: requiredString(row.id, 'id'),
    slug: requiredString(row.slug, 'slug'),
    restaurantName: requiredString(row.restaurant_name, 'restaurant_name'),
    visitedAt: dateString(row.visited_at, 'visited_at'),
    participantCount: numberValue(row.participant_count, 'participant_count'),
    quorum: numberValue(row.quorum, 'quorum'),
    hasSubmitted: booleanValue(row.has_submitted),
    publicationState: publicationState(row.publication_state),
  };
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'visita';
}

const CREATE_VISIT_SQL = `
WITH restaurant AS (
  INSERT INTO restaurants (slug, name, cuisine, neighborhood, city, address, price_band)
  VALUES ($3, $2, $4, $5, $6, $7, $8)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    cuisine = EXCLUDED.cuisine,
    neighborhood = EXCLUDED.neighborhood,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    price_band = EXCLUDED.price_band
  RETURNING id
),
visit_slug AS (
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM visits WHERE slug = $10) THEN $10
    ELSE (
      SELECT $10 || '-' || suffix
      FROM generate_series(2, 999) suffix
      WHERE NOT EXISTS (SELECT 1 FROM visits WHERE slug = $10 || '-' || suffix)
      ORDER BY suffix
      LIMIT 1
    )
  END AS slug
),
created AS (
  INSERT INTO visits (slug, restaurant_id, created_by, visited_at)
  SELECT vs.slug, r.id, $1, $9
  FROM restaurant r, visit_slug vs
  RETURNING *
)
SELECT * FROM created`;

function visitFromRow(row: Row): VisitRecord {
  return {
    id: requiredString(row.id, 'id'),
    slug: requiredString(row.slug, 'slug'),
    restaurantId: requiredString(row.restaurant_id, 'restaurant_id'),
    createdBy: nullableString(row.created_by, 'created_by'),
    visitedAt: dateString(row.visited_at, 'visited_at'),
    quorum: numberValue(row.quorum, 'quorum'),
    publicationState: publicationState(row.publication_state),
    publicationReason: nullablePublicationReason(row.publication_reason),
    publishedAt: nullableDateString(row.published_at, 'published_at'),
    publishedBy: nullableString(row.published_by, 'published_by'),
    hiddenAt: nullableDateString(row.hidden_at, 'hidden_at'),
    hiddenBy: nullableString(row.hidden_by, 'hidden_by'),
    legacyReviewId: nullableString(row.legacy_review_id, 'legacy_review_id'),
    legacyPayload: recordValue(row.legacy_payload, 'legacy_payload'),
  };
}

function memberFromRow(row: Row): MemberRecord {
  if (row.role !== 'member' && row.role !== 'admin') {
    throw new Error('Resposta inválida do banco: role.');
  }
  return {
    id: requiredString(row.id, 'id'),
    authUserId: requiredString(row.auth_user_id, 'auth_user_id'),
    email: requiredString(row.email, 'email'),
    slug: requiredString(row.slug, 'slug'),
    displayName: requiredString(row.display_name, 'display_name'),
    avatarUrl: nullableString(row.avatar_url, 'avatar_url'),
    societyTitle: nullableString(row.society_title, 'society_title'),
    memberNumber: numberValue(row.member_number, 'member_number'),
    bio: requiredString(row.bio, 'bio'),
    favoriteCuisine: nullableString(row.favorite_cuisine, 'favorite_cuisine'),
    role: row.role,
  };
}

function photoFromRow(row: Row): PhotoRecord {
  if (row.content_type !== 'image/webp') {
    throw new Error('Resposta inválida do banco: content_type.');
  }
  return {
    id: requiredString(row.id, 'id'),
    visitId: requiredString(row.visit_id, 'visit_id'),
    uploadedBy: nullableString(row.uploaded_by, 'uploaded_by'),
    url: requiredString(row.url, 'url'),
    pathname: requiredString(row.pathname, 'pathname'),
    contentType: row.content_type,
    sizeBytes: numberValue(row.size_bytes, 'size_bytes'),
    position: numberValue(row.position, 'position'),
  };
}

function submissionFromRow(row: Row): SubmissionResult {
  return {
    visitId: requiredString(row.visit_id, 'visit_id'),
    publicationState: publicationState(row.publication_state),
    publicationReason: nullablePublicationReason(row.publication_reason),
    participantCount: numberValue(row.participant_count, 'participant_count'),
    publicationChanged: booleanValue(row.publication_changed),
  };
}

// Neon HTTP transactions are non-interactive. Each composed operation therefore
// keeps its conditional transition and event inside one CTE statement. The
// scorecard branch mirrors resolvePublication's only automatic transition:
// private -> published when the post-upsert participant count reaches quorum.
const ATOMIC_SCORECARD_SQL = `
WITH existing_scorecard AS MATERIALIZED (
  SELECT EXISTS (
    SELECT 1 FROM scorecards WHERE visit_id = $1 AND member_id = $2
  ) AS existed
),
saved AS (
  INSERT INTO scorecards
    (visit_id, member_id, food, service, ambience, value, access, wait_time, comment)
  SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
  FROM existing_scorecard
  ON CONFLICT (visit_id, member_id) DO UPDATE SET
    food = EXCLUDED.food,
    service = EXCLUDED.service,
    ambience = EXCLUDED.ambience,
    value = EXCLUDED.value,
    access = EXCLUDED.access,
    wait_time = EXCLUDED.wait_time,
    comment = EXCLUDED.comment,
    updated_at = NOW()
  RETURNING visit_id
),
visit_context AS MATERIALIZED (
  SELECT v.id, v.publication_state, v.publication_reason
  FROM visits v
  JOIN saved s ON s.visit_id = v.id
  FOR UPDATE OF v
),
score_count AS (
  SELECT (
    COUNT(*) + CASE WHEN (SELECT existed FROM existing_scorecard) THEN 0 ELSE 1 END
  )::int AS participant_count
  FROM scorecards s
  WHERE s.visit_id = (SELECT id FROM visit_context)
),
transition AS (
  UPDATE visits v
  SET publication_state = $12,
      publication_reason = $13,
      published_at = CASE WHEN $12 = 'published' THEN NOW() ELSE v.published_at END,
      published_by = CASE WHEN $12 = 'published' THEN NULL ELSE v.published_by END,
      updated_at = NOW(),
      version = v.version + 1
  FROM visit_context vc, score_count sc
  WHERE v.id = vc.id
    AND vc.publication_state = $10
    AND vc.publication_state <> $12
    AND sc.participant_count >= $11
  RETURNING v.publication_state, v.publication_reason
),
event AS (
  INSERT INTO publication_events (visit_id, actor_id, action, participant_count)
  SELECT vc.id, NULL, 'quorum_publish', sc.participant_count
  FROM visit_context vc, score_count sc, transition t
  RETURNING id
)
SELECT
  vc.id AS visit_id,
  COALESCE(t.publication_state, vc.publication_state) AS publication_state,
  CASE WHEN t.publication_state IS NOT NULL THEN t.publication_reason ELSE vc.publication_reason END
    AS publication_reason,
  sc.participant_count,
  (t.publication_state IS NOT NULL) AS publication_changed
FROM visit_context vc
CROSS JOIN score_count sc
LEFT JOIN transition t ON TRUE
LEFT JOIN event e ON TRUE
LIMIT 1`;

const ATOMIC_PUBLICATION_SQL = `
WITH locked_visit AS MATERIALIZED (
  SELECT * FROM visits WHERE id = $1 FOR UPDATE
),
score_count AS (
  SELECT COUNT(*)::int AS participant_count
  FROM scorecards
  WHERE visit_id = $1
),
transition AS (
  UPDATE visits v
  SET publication_state = $3,
      publication_reason = $4,
      published_at = CASE WHEN $3 = 'published' THEN NOW() ELSE v.published_at END,
      published_by = CASE WHEN $3 = 'published' THEN $5 ELSE v.published_by END,
      hidden_at = CASE WHEN $3 = 'hidden' THEN NOW() ELSE NULL END,
      hidden_by = CASE WHEN $3 = 'hidden' THEN $5 ELSE NULL END,
      updated_at = NOW(),
      version = v.version + 1
  FROM locked_visit lv, score_count sc
  WHERE v.id = lv.id
    AND lv.publication_state = $2
    AND lv.publication_state <> $3
    AND ($6 = 'hide' OR sc.participant_count >= 1)
  RETURNING v.*
),
event AS (
  INSERT INTO publication_events (visit_id, actor_id, action, participant_count)
  SELECT t.id, $5, $6, sc.participant_count
  FROM transition t, score_count sc
  RETURNING id
)
SELECT
  COALESCE(t.id, lv.id) AS id,
  COALESCE(t.slug, lv.slug) AS slug,
  COALESCE(t.restaurant_id, lv.restaurant_id) AS restaurant_id,
  CASE WHEN t.id IS NOT NULL THEN t.created_by ELSE lv.created_by END AS created_by,
  COALESCE(t.visited_at, lv.visited_at) AS visited_at,
  COALESCE(t.quorum, lv.quorum) AS quorum,
  COALESCE(t.publication_state, lv.publication_state) AS publication_state,
  CASE WHEN t.id IS NOT NULL THEN t.publication_reason ELSE lv.publication_reason END AS publication_reason,
  CASE WHEN t.id IS NOT NULL THEN t.published_at ELSE lv.published_at END AS published_at,
  CASE WHEN t.id IS NOT NULL THEN t.published_by ELSE lv.published_by END AS published_by,
  CASE WHEN t.id IS NOT NULL THEN t.hidden_at ELSE lv.hidden_at END AS hidden_at,
  CASE WHEN t.id IS NOT NULL THEN t.hidden_by ELSE lv.hidden_by END AS hidden_by,
  CASE WHEN t.id IS NOT NULL THEN t.legacy_review_id ELSE lv.legacy_review_id END AS legacy_review_id,
  CASE WHEN t.id IS NOT NULL THEN t.legacy_payload ELSE lv.legacy_payload END AS legacy_payload
FROM locked_visit lv
LEFT JOIN transition t ON TRUE
LEFT JOIN event e ON TRUE
LIMIT 1`;

const ATOMIC_PHOTO_SQL = `
WITH locked_visit AS MATERIALIZED (
  SELECT id FROM visits WHERE id = $1 FOR UPDATE
),
next_position AS (
  SELECT MIN(candidate.position)::int AS position
  FROM locked_visit lv
  CROSS JOIN generate_series(1, 5) candidate(position)
  LEFT JOIN visit_photos p
    ON p.visit_id = lv.id
   AND p.position = candidate.position
  WHERE p.id IS NULL
),
inserted AS (
  INSERT INTO visit_photos
    (visit_id, uploaded_by, url, pathname, content_type, size_bytes, position)
  SELECT $1, $2, $3, $4, $5, $6, np.position
  FROM next_position np
  WHERE np.position IS NOT NULL
  RETURNING id
)
SELECT
  (SELECT id FROM locked_visit) AS visit_id,
  (SELECT id FROM inserted) AS id`;

class NeonReviewRepository implements ReviewRepository {
  constructor(private readonly sql: ReviewSqlClient) {}

  async submitScorecardAtomically(input: AtomicScorecardSubmissionInput): Promise<SubmissionResult> {
    const { scorecard } = input;
    const [rows] = await serializableTransaction(
      this.sql,
      (transaction) => [transaction.query(ATOMIC_SCORECARD_SQL, [
        input.visitId,
        input.memberId,
        scorecard.food,
        scorecard.service,
        scorecard.ambience,
        scorecard.value,
        scorecard.access,
        scorecard.waitTime,
        scorecard.comment,
        input.expectedPublicationState,
        input.quorum,
        input.transitionAtQuorum.state,
        input.transitionAtQuorum.reason,
      ])],
    );
    const row = rows[0];
    if (!row) throw new Error('Visita não encontrada.');
    return submissionFromRow(row);
  }

  async findMemberByAuthUserId(authUserId: string): Promise<MemberRecord | null> {
    const rows = await this.sql.query(
      `SELECT id, auth_user_id, email, slug, display_name, avatar_url, society_title,
              member_number, bio, favorite_cuisine, role
       FROM members
       WHERE auth_user_id = $1`,
      [authUserId],
    );
    return rows[0] ? memberFromRow(rows[0]) : null;
  }

  async findMemberById(memberId: string): Promise<MemberRecord | null> {
    const rows = await this.sql.query(
      `SELECT id, auth_user_id, email, slug, display_name, avatar_url, society_title,
              member_number, bio, favorite_cuisine, role
       FROM members
       WHERE id = $1`,
      [memberId],
    );
    return rows[0] ? memberFromRow(rows[0]) : null;
  }

  async findVisitById(visitId: string): Promise<VisitRecord | null> {
    const rows = await this.sql.query(
      `SELECT id, slug, restaurant_id, created_by, visited_at, quorum,
              publication_state, publication_reason, published_at, published_by,
              hidden_at, hidden_by, legacy_review_id, legacy_payload
       FROM visits
       WHERE id = $1`,
      [visitId],
    );
    return rows[0] ? visitFromRow(rows[0]) : null;
  }

  async createVisit(actorId: string, input: CreateVisitInput): Promise<VisitRecord> {
    const restaurantSlug = slugify(input.restaurantName);
    const visitSlug = `${restaurantSlug}-${input.visitedAt}`;
    const [rows] = await serializableTransaction(
      this.sql,
      (transaction) => [transaction.query(CREATE_VISIT_SQL, [
        actorId,
        input.restaurantName,
        restaurantSlug,
        input.cuisine,
        input.neighborhood,
        input.city,
        input.address ?? null,
        input.priceBand ?? null,
        input.visitedAt,
        visitSlug,
      ])],
    );
    const row = rows[0];
    if (!row) throw new Error('Não foi possível criar a visita.');
    return visitFromRow(row);
  }

  async upsertScorecard(visitId: string, memberId: string, input: ScorecardInput): Promise<void> {
    await this.sql.query(
      `INSERT INTO scorecards
         (visit_id, member_id, food, service, ambience, value, access, wait_time, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (visit_id, member_id) DO UPDATE SET
         food = EXCLUDED.food,
         service = EXCLUDED.service,
         ambience = EXCLUDED.ambience,
         value = EXCLUDED.value,
         access = EXCLUDED.access,
         wait_time = EXCLUDED.wait_time,
         comment = EXCLUDED.comment,
         updated_at = NOW()`,
      [
        visitId,
        memberId,
        input.food,
        input.service,
        input.ambience,
        input.value,
        input.access,
        input.waitTime,
        input.comment,
      ],
    );
  }

  async countScorecards(visitId: string): Promise<number> {
    const rows = await this.sql.query(
      'SELECT COUNT(*)::int AS participant_count FROM scorecards WHERE visit_id = $1',
      [visitId],
    );
    return rows[0] ? numberValue(rows[0].participant_count, 'participant_count') : 0;
  }

  async updatePublication(
    visitId: string,
    state: PublicationState,
    reason: PublicationReason,
    actorId: string | null,
  ): Promise<VisitRecord> {
    const rows = await this.sql.query(
      `UPDATE visits
       SET publication_state = $2,
           publication_reason = $3,
           published_at = CASE WHEN $2 = 'published' THEN NOW() ELSE published_at END,
           published_by = CASE WHEN $2 = 'published' THEN $4 ELSE published_by END,
           hidden_at = CASE WHEN $2 = 'hidden' THEN NOW() ELSE NULL END,
           hidden_by = CASE WHEN $2 = 'hidden' THEN $4 ELSE NULL END,
           updated_at = NOW(),
           version = version + 1
       WHERE id = $1
       RETURNING id, slug, restaurant_id, created_by, visited_at, quorum,
                 publication_state, publication_reason, published_at, published_by,
                 hidden_at, hidden_by, legacy_review_id, legacy_payload`,
      [visitId, state, reason, actorId],
    );
    if (!rows[0]) throw new Error('Visita não encontrada.');
    return visitFromRow(rows[0]);
  }

  async recordPublicationEvent(input: PublicationEventInput): Promise<void> {
    await this.sql.query(
      `INSERT INTO publication_events (visit_id, actor_id, action, participant_count)
       VALUES ($1, $2, $3, $4)`,
      [input.visitId, input.actorId, input.action, input.participantCount],
    );
  }

  async changePublicationAtomically(input: AtomicPublicationChangeInput): Promise<VisitRecord> {
    const [rows] = await serializableTransaction(
      this.sql,
      (transaction) => [transaction.query(ATOMIC_PUBLICATION_SQL, [
        input.visitId,
        input.expectedPublicationState,
        input.state,
        input.reason,
        input.actorId,
        input.action,
      ])],
    );
    const row = rows[0];
    if (!row) throw new Error('Visita não encontrada.');
    return visitFromRow(row);
  }

  async attachPhoto(visitId: string, actorId: string, input: PhotoInput): Promise<void> {
    const [rows] = await serializableTransaction(
      this.sql,
      (transaction) => [transaction.query(ATOMIC_PHOTO_SQL, [
        visitId,
        actorId,
        input.url,
        input.pathname,
        input.contentType,
        input.sizeBytes,
      ])],
    );
    const row = rows[0];
    if (!row || row.visit_id === null) throw new Error('Visita não encontrada.');
    if (row.id === null) throw new Error('A visita já possui o máximo de cinco fotos.');
  }

  async findPhotoById(photoId: string): Promise<PhotoRecord | null> {
    const rows = await this.sql.query(
      `SELECT id, visit_id, uploaded_by, url, pathname, content_type, size_bytes, position
       FROM visit_photos
       WHERE id = $1`,
      [photoId],
    );
    return rows[0] ? photoFromRow(rows[0]) : null;
  }

  async deletePhoto(visitId: string, photoId: string, actorId: string): Promise<PhotoRecord> {
    const rows = await this.sql.query(
      `DELETE FROM visit_photos photo
       USING members actor
       WHERE photo.id = $2
         AND photo.visit_id = $1
         AND actor.id = $3
         AND (photo.uploaded_by = $3 OR actor.role = 'admin')
       RETURNING photo.id, photo.visit_id, photo.uploaded_by, photo.url, photo.pathname,
                 photo.content_type, photo.size_bytes, photo.position`,
      [visitId, photoId, actorId],
    );
    if (!rows[0]) throw new Error('Foto não encontrada ou remoção não autorizada.');
    return photoFromRow(rows[0]);
  }

  async countVisitPhotos(visitId: string): Promise<number> {
    const rows = await this.sql.query(
      'SELECT COUNT(*)::int AS photo_count FROM visit_photos WHERE visit_id = $1',
      [visitId],
    );
    return rows[0] ? numberValue(rows[0].photo_count, 'photo_count') : 0;
  }

  async listPublicVisits(filters: PublicVisitFilters): Promise<PublicVisitSummary[]> {
    const rows = await this.sql.query(
      `SELECT
         v.id,
         v.slug,
         v.visited_at,
         v.published_at,
         r.slug AS restaurant_slug,
         r.name AS restaurant_name,
         r.cuisine,
         r.neighborhood,
         r.city,
         r.address,
         r.price_band,
         aggregate.participant_count,
         aggregate.average_food,
         aggregate.average_service,
         aggregate.average_ambience,
         aggregate.average_value,
         aggregate.average_access,
         aggregate.average_wait_time,
         aggregate.overall,
         (SELECT p.url FROM visit_photos p WHERE p.visit_id = v.id ORDER BY p.position LIMIT 1)
           AS cover_photo_url
       FROM visits v
       JOIN restaurants r ON r.id = v.restaurant_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(s.id)::int AS participant_count,
           ROUND(AVG(s.food)::numeric, 1)::float8 AS average_food,
           ROUND(AVG(s.service)::numeric, 1)::float8 AS average_service,
           ROUND(AVG(s.ambience)::numeric, 1)::float8 AS average_ambience,
           ROUND(AVG(s.value)::numeric, 1)::float8 AS average_value,
           ROUND(AVG(s.access)::numeric, 1)::float8 AS average_access,
           ROUND(AVG(s.wait_time)::numeric, 1)::float8 AS average_wait_time,
           ROUND(AVG((s.food + s.service + s.ambience + s.value + s.access + s.wait_time) / 6.0)::numeric, 1)::float8
             AS overall
         FROM scorecards s
         WHERE s.visit_id = v.id
       ) aggregate ON TRUE
       WHERE v.publication_state = 'published'
         AND ($1::text IS NULL OR r.name ILIKE '%' || $1 || '%' OR r.cuisine ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR r.cuisine ILIKE $2)
         AND ($3::text IS NULL OR r.neighborhood ILIKE $3)
       ORDER BY v.published_at DESC, v.id`,
      [filters.busca ?? null, filters.culinaria ?? null, filters.bairro ?? null],
    );
    return rows.map(publicVisitSummaryFromRow);
  }

  async getPublicVisitBySlug(slug: string): Promise<PublicVisitDetail | null> {
    const rows = await this.sql.query(
      `SELECT
         v.id,
         v.slug,
         v.visited_at,
         v.published_at,
         v.legacy_review_id,
         v.legacy_payload,
         r.slug AS restaurant_slug,
         r.name AS restaurant_name,
         r.cuisine,
         r.neighborhood,
         r.city,
         r.address,
         r.price_band,
         aggregate.participant_count,
         aggregate.average_food,
         aggregate.average_service,
         aggregate.average_ambience,
         aggregate.average_value,
         aggregate.average_access,
         aggregate.average_wait_time,
         aggregate.overall,
         (SELECT p.url FROM visit_photos p WHERE p.visit_id = v.id ORDER BY p.position LIMIT 1)
           AS cover_photo_url,
         COALESCE(photos.items, '[]'::jsonb) AS photos,
         COALESCE(comments.items, '[]'::jsonb) AS comments
       FROM visits v
       JOIN restaurants r ON r.id = v.restaurant_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(s.id)::int AS participant_count,
           ROUND(AVG(s.food)::numeric, 1)::float8 AS average_food,
           ROUND(AVG(s.service)::numeric, 1)::float8 AS average_service,
           ROUND(AVG(s.ambience)::numeric, 1)::float8 AS average_ambience,
           ROUND(AVG(s.value)::numeric, 1)::float8 AS average_value,
           ROUND(AVG(s.access)::numeric, 1)::float8 AS average_access,
           ROUND(AVG(s.wait_time)::numeric, 1)::float8 AS average_wait_time,
           ROUND(AVG((s.food + s.service + s.ambience + s.value + s.access + s.wait_time) / 6.0)::numeric, 1)::float8
             AS overall
         FROM scorecards s
         WHERE s.visit_id = v.id
       ) aggregate ON TRUE
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'id', p.id,
           'url', p.url,
           'position', p.position
         ) ORDER BY p.position) AS items
         FROM visit_photos p
         WHERE p.visit_id = v.id
       ) photos ON TRUE
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'memberId', s.member_id,
           'displayName', m.display_name,
           'avatarUrl', m.avatar_url,
           'comment', s.comment
         ) ORDER BY s.created_at) AS items
         FROM scorecards s
         JOIN members m ON m.id = s.member_id
         WHERE s.visit_id = v.id
       ) comments ON TRUE
       WHERE v.slug = $1
         AND v.publication_state = 'published'`,
      [slug],
    );
    if (!rows[0]) return null;
    return publicVisitDetailFromRow(rows[0]);
  }

  async listPublicMembers(): Promise<PublicMemberSummary[]> {
    const rows = await this.sql.query(
      `SELECT
         m.slug,
         m.display_name,
         m.avatar_url,
         m.society_title,
         m.member_number,
         m.bio,
         m.favorite_cuisine,
         COUNT(DISTINCT v.id) FILTER (WHERE v.id IS NOT NULL)::int AS published_visits,
         COUNT(s.id) FILTER (WHERE v.id IS NOT NULL)::int AS scorecard_count
       FROM members m
       LEFT JOIN scorecards s ON s.member_id = m.id
       LEFT JOIN visits v
         ON v.id = s.visit_id
        AND v.publication_state = 'published'
       GROUP BY m.id
       ORDER BY m.member_number`,
    );
    return rows.map(publicMemberFromRow);
  }

  async listPendingVisitsForMember(memberId: string): Promise<PendingVisit[]> {
    const rows = await this.sql.query(
      `SELECT
         v.id,
         v.slug,
         r.name AS restaurant_name,
         v.visited_at,
         v.quorum,
         v.publication_state,
         COUNT(s.id)::int AS participant_count,
         FALSE AS has_submitted
       FROM visits v
       JOIN restaurants r ON r.id = v.restaurant_id
       LEFT JOIN scorecards s ON s.visit_id = v.id
       WHERE NOT EXISTS (
         SELECT 1
         FROM scorecards own
         WHERE own.visit_id = v.id
           AND own.member_id = $1
       )
       GROUP BY v.id, r.name
       ORDER BY v.visited_at DESC, v.id`,
      [memberId],
    );
    return rows.map(pendingVisitFromRow);
  }
}

export function createNeonReviewRepository(sql: ReviewSqlClient = getDb()): ReviewRepository {
  return new NeonReviewRepository(sql);
}
