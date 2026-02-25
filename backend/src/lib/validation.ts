import type {
  BlogPostInput,
  BuildInput,
  CategoryInput,
  InventoryCategory,
  InventoryInput,
  LoginInput,
  MutablePayload,
  OrderInput,
  OrderStatus,
  PasswordChangeInput,
  PersonalProcurementInput,
  ProcurementInput,
  SiteContentInput,
  ValidationResult,
} from './types.ts';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const DEAL_DATE_PATTERN = /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
const BLOG_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const uniqueTrimmedStrings = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(normalized)];
};

const parseSiteStats = (values: unknown): Array<{ value: string; label: string }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const value = asString(typed.value).trim();
      const label = asString(typed.label).trim();
      if (!value || !label) {
        return null;
      }

      return { value, label };
    })
    .filter((item): item is { value: string; label: string } => item !== null);
};

const parseShippingSteps = (values: unknown): Array<{ title: string; description: string }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const title = asString(typed.title).trim();
      const description = asString(typed.description).trim();
      if (!title || !description) {
        return null;
      }

      return { title, description };
    })
    .filter((item): item is { title: string; description: string } => item !== null);
};

const parseTestimonials = (values: unknown): Array<{ quote: string; name: string; tag: string }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const quote = asString(typed.quote).trim();
      const name = asString(typed.name).trim();
      const tag = asString(typed.tag).trim();
      if (!quote || !name || !tag) {
        return null;
      }

      return { quote, name, tag };
    })
    .filter((item): item is { quote: string; name: string; tag: string } => item !== null);
};

const parseContactChannels = (
  values: unknown,
): Array<{ icon: string; label: string; value: string; href: string }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const icon = asString(typed.icon).trim();
      const label = asString(typed.label).trim();
      const value = asString(typed.value).trim();
      const href = asString(typed.href).trim();
      if (!icon || !label || !value || !href) {
        return null;
      }

      return { icon, label, value, href };
    })
    .filter((item): item is { icon: string; label: string; value: string; href: string } => item !== null);
};

const parseBrandPortfolios = (
  values: unknown,
): Array<{ id: string; name: string; tagline: string; focus: string[]; images: string[]; tags: string[] }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id).trim();
      const name = asString(typed.name).trim();
      const tagline = asString(typed.tagline).trim();
      const focus = uniqueTrimmedStrings(typed.focus);
      const images = uniqueTrimmedStrings(typed.images);
      const tags = uniqueTrimmedStrings(typed.tags);

      if (!id || !name || !tagline || focus.length === 0 || images.length === 0 || tags.length === 0) {
        return null;
      }

      return { id, name, tagline, focus, images, tags };
    })
    .filter(
      (item): item is { id: string; name: string; tagline: string; focus: string[]; images: string[]; tags: string[] } =>
        item !== null,
    );
};

const parseCategoryFaqs = (values: unknown): Array<{ question: string; answer: string }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const question = asString(typed.question).trim();
      const answer = asString(typed.answer).trim();
      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => item !== null);
};

const parseBlogSections = (
  values: unknown,
): Array<{ heading: string; paragraphs: string[]; bullets: string[] }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const heading = asString(typed.heading).trim();
      const paragraphs = uniqueTrimmedStrings(typed.paragraphs);
      const bullets = uniqueTrimmedStrings(typed.bullets);

      if (!heading || paragraphs.length === 0) {
        return null;
      }

      return { heading, paragraphs, bullets };
    })
    .filter(
      (item): item is { heading: string; paragraphs: string[]; bullets: string[] } => item !== null,
    );
};

export const validateLoginInput = (payload: MutablePayload): ValidationResult<LoginInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.username)) {
    errors.push('username is required');
  }

  if (!isNonEmptyString(payload.password)) {
    errors.push('password is required');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      username: asString(payload.username).trim(),
      password: asString(payload.password),
    },
  };
};

export const validateBuildInput = (payload: MutablePayload): ValidationResult<BuildInput> => {
  const errors: string[] = [];

  const price = Number(payload.price);
  const description = asString(payload.description).trim();

  if (!isNonEmptyString(payload.name)) {
    errors.push('name is required');
  }

  if (!isNonEmptyString(payload.description)) {
    errors.push('description is required');
  }

  const detailIntro = asString(payload.detailIntro).trim() || description;
  const requirementIntro = asString(payload.requirementIntro).trim();

  if (!requirementIntro) {
    errors.push('requirementIntro is required');
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.push('price must be a positive number');
  }

  if (!isNonEmptyString(payload.dealDate) || !DEAL_DATE_PATTERN.test(payload.dealDate.trim())) {
    errors.push('dealDate must match YYYY/MM/DD');
  }

  if (!isNonEmptyString(payload.image)) {
    errors.push('image is required');
  }

  if (!isNonEmptyString(payload.cpu)) {
    errors.push('cpu is required');
  }

  if (!isNonEmptyString(payload.ram)) {
    errors.push('ram is required');
  }

  if (!isNonEmptyString(payload.storage)) {
    errors.push('storage is required');
  }

  if (!isNonEmptyString(payload.gpu)) {
    errors.push('gpu is required');
  }

  if (!isNonEmptyString(payload.psu)) {
    errors.push('psu is required');
  }

  if (!isNonEmptyString(payload.pcCase)) {
    errors.push('pcCase is required');
  }

  const specs = uniqueTrimmedStrings(payload.specs);

  return {
    ok: errors.length === 0,
    errors,
    value: {
      name: asString(payload.name).trim(),
      description,
      detailIntro,
      requirementIntro,
      youtubeEmbedUrl: asString(payload.youtubeEmbedUrl).trim(),
      price,
      dealDate: asString(payload.dealDate).trim(),
      image: asString(payload.image).trim(),
      badge: isNonEmptyString(payload.badge) ? payload.badge.trim() : '',
      cpu: asString(payload.cpu).trim(),
      ram: asString(payload.ram).trim(),
      storage: asString(payload.storage).trim(),
      gpu: asString(payload.gpu).trim(),
      psu: asString(payload.psu).trim(),
      pcCase: asString(payload.pcCase).trim(),
      specs,
    },
  };
};

export const validateCategoryInput = (
  payload: MutablePayload,
): ValidationResult<CategoryInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.title)) {
    errors.push('title is required');
  }

  if (!isNonEmptyString(payload.summary)) {
    errors.push('summary is required');
  }

  if (!isNonEmptyString(payload.primaryCategory)) {
    errors.push('primaryCategory is required');
  }

  if (!isNonEmptyString(payload.secondaryCategory)) {
    errors.push('secondaryCategory is required');
  }

  const tags = uniqueTrimmedStrings(payload.tags);
  if (!tags.length) {
    errors.push('tags must contain at least one item');
  }

  const points = uniqueTrimmedStrings(payload.points);
  if (!points.length) {
    errors.push('points must contain at least one item');
  }

  if (!isNonEmptyString(payload.detailIntro)) {
    errors.push('detailIntro is required');
  }

  if (!isNonEmptyString(payload.detailHeroImage)) {
    errors.push('detailHeroImage is required');
  }

  const detailRecommendations = uniqueTrimmedStrings(payload.detailRecommendations);
  if (!detailRecommendations.length) {
    errors.push('detailRecommendations must contain at least one item');
  }

  const detailFaqs = parseCategoryFaqs(payload.detailFaqs);
  if (!detailFaqs.length) {
    errors.push('detailFaqs must contain at least one item');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      title: asString(payload.title).trim(),
      summary: asString(payload.summary).trim(),
      primaryCategory: asString(payload.primaryCategory).trim(),
      secondaryCategory: asString(payload.secondaryCategory).trim(),
      tags,
      points,
      detailIntro: asString(payload.detailIntro).trim(),
      detailHeroImage: asString(payload.detailHeroImage).trim(),
      detailRecommendations,
      detailFaqs,
    },
  };
};

export const ORDER_STATUS: OrderStatus[] = ['pending', 'shipping', 'delivered', 'cancelled'];

export const INVENTORY_CATEGORY_OPTIONS: InventoryCategory[] = [
  'cpu',
  'motherboard',
  'gpu',
  'ram',
  'ssd',
  'hdd',
  'cooler',
  'psu',
  'case',
];

const INVENTORY_MOTHERBOARD_FORM_FACTORS = ['ATX', 'MATX', 'ITX', 'E-ATX', 'SSI-EEB', '其他'];

const parseProcurementItems = (
  values: unknown,
  defaultTaxIncluded: boolean,
): Array<{ productName: string; quantity: number; unitPrice: number; taxIncluded: boolean }> => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const productName = asString(typed.productName).trim();
      const quantity = Number(typed.quantity);
      const unitPrice = Number(typed.unitPrice);
      const taxIncluded = typeof typed.taxIncluded === 'boolean' ? typed.taxIncluded : defaultTaxIncluded;

      if (
        !productName ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return null;
      }

      return {
        productName,
        quantity,
        unitPrice: Math.trunc(unitPrice),
        taxIncluded,
      };
    })
    .filter(
      (item): item is { productName: string; quantity: number; unitPrice: number; taxIncluded: boolean } =>
        item !== null,
    );
};

export const validateOrderInput = (payload: MutablePayload): ValidationResult<OrderInput> => {
  const errors: string[] = [];
  const item = asString(payload.item).trim();
  const requirementIntro = asString(payload.requirementIntro).trim();
  const tags = uniqueTrimmedStrings(payload.tags);

  if (!isNonEmptyString(payload.date)) {
    errors.push('date is required');
  }

  if (!isNonEmptyString(payload.item)) {
    errors.push('item is required');
  }

  if (!requirementIntro) {
    errors.push('requirementIntro is required');
  }

  if (!tags.length) {
    errors.push('tags must contain at least one item');
  }

  if (!isNonEmptyString(payload.location)) {
    errors.push('location is required');
  }

  const salePrice = Number(payload.salePrice);
  if (!Number.isFinite(salePrice) || salePrice < 0) {
    errors.push('salePrice must be a number greater than or equal to 0');
  }

  if (!isNonEmptyString(payload.cpu)) {
    errors.push('cpu is required');
  }

  if (!isNonEmptyString(payload.ram)) {
    errors.push('ram is required');
  }

  if (!isNonEmptyString(payload.storage)) {
    errors.push('storage is required');
  }

  if (!isNonEmptyString(payload.gpu)) {
    errors.push('gpu is required');
  }

  if (!isNonEmptyString(payload.psu)) {
    errors.push('psu is required');
  }

  if (!isNonEmptyString(payload.pcCase)) {
    errors.push('pcCase is required');
  }

  const rawStatus = isNonEmptyString(payload.status) ? payload.status.trim().toLowerCase() : 'pending';
  const status = rawStatus as OrderStatus;
  if (!ORDER_STATUS.includes(status)) {
    errors.push(`status must be one of: ${ORDER_STATUS.join(', ')}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      date: asString(payload.date).trim(),
      item,
      requirementIntro,
      youtubeEmbedUrl: asString(payload.youtubeEmbedUrl).trim(),
      tags,
      location: asString(payload.location).trim(),
      salePrice: Number.isFinite(salePrice) ? Math.max(0, Math.trunc(salePrice)) : 0,
      status,
      cpu: asString(payload.cpu).trim(),
      ram: asString(payload.ram).trim(),
      storage: asString(payload.storage).trim(),
      gpu: asString(payload.gpu).trim(),
      psu: asString(payload.psu).trim(),
      pcCase: asString(payload.pcCase).trim(),
    },
  };
};

export const validateBlogPostInput = (
  payload: MutablePayload,
): ValidationResult<BlogPostInput> => {
  const errors: string[] = [];

  const slug = asString(payload.slug).trim().toLowerCase();
  const title = asString(payload.title).trim();
  const summary = asString(payload.summary).trim();
  const coverImage = asString(payload.coverImage).trim();
  const publishedAt = asString(payload.publishedAt).trim();
  const updatedAt = asString(payload.updatedAt).trim();
  const authorName = asString(payload.authorName).trim();
  const youtubeEmbedUrl = asString(payload.youtubeEmbedUrl).trim();
  const tags = uniqueTrimmedStrings(payload.tags);
  const sections = parseBlogSections(payload.sections);

  if (!slug) {
    errors.push('slug is required');
  } else if (!BLOG_SLUG_PATTERN.test(slug)) {
    errors.push('slug must be kebab-case');
  }

  if (!title) {
    errors.push('title is required');
  }

  if (!summary) {
    errors.push('summary is required');
  }

  if (!coverImage) {
    errors.push('coverImage is required');
  }

  if (!publishedAt || !BLOG_DATE_PATTERN.test(publishedAt)) {
    errors.push('publishedAt must match YYYY-MM-DD');
  }

  if (!updatedAt || !BLOG_DATE_PATTERN.test(updatedAt)) {
    errors.push('updatedAt must match YYYY-MM-DD');
  }

  if (!authorName) {
    errors.push('authorName is required');
  }

  const readingMinutes = Number(payload.readingMinutes);
  if (!Number.isInteger(readingMinutes) || readingMinutes <= 0) {
    errors.push('readingMinutes must be a positive integer');
  }

  if (tags.length === 0) {
    errors.push('tags must contain at least one item');
  }

  if (sections.length === 0) {
    errors.push('sections must contain at least one valid section');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      slug,
      title,
      summary,
      coverImage,
      publishedAt,
      updatedAt,
      authorName,
      readingMinutes: Number.isInteger(readingMinutes) ? readingMinutes : 1,
      tags,
      youtubeEmbedUrl,
      sections,
    },
  };
};

export const validateInventoryInput = (
  payload: MutablePayload,
): ValidationResult<InventoryInput> => {
  const errors: string[] = [];

  const rawCategory = isNonEmptyString(payload.category) ? payload.category.trim().toLowerCase() : '';
  const category = rawCategory as InventoryCategory;
  if (!INVENTORY_CATEGORY_OPTIONS.includes(category)) {
    errors.push(`category must be one of: ${INVENTORY_CATEGORY_OPTIONS.join(', ')}`);
  }

  if (!isNonEmptyString(payload.brand)) {
    errors.push('brand is required');
  }

  if (!isNonEmptyString(payload.productName)) {
    errors.push('productName is required');
  }

  const motherboardFormFactor = asString(payload.motherboardFormFactor).trim().toUpperCase();
  if (category === 'motherboard' && !motherboardFormFactor) {
    errors.push(`motherboardFormFactor is required for motherboard (${INVENTORY_MOTHERBOARD_FORM_FACTORS.join('/')})`);
  }

  const quantity = Number(payload.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) {
    errors.push('quantity must be an integer greater than or equal to 0');
  }

  const taxIncluded = typeof payload.taxIncluded === 'boolean' ? payload.taxIncluded : true;

  const retailPrice = Number(payload.retailPrice);
  if (!Number.isFinite(retailPrice) || retailPrice < 0) {
    errors.push('retailPrice must be a number greater than or equal to 0');
  }

  const costPrice = Number(payload.costPrice);
  if (!Number.isFinite(costPrice) || costPrice < 0) {
    errors.push('costPrice must be a number greater than or equal to 0');
  }

  if (Number.isFinite(retailPrice) && Number.isFinite(costPrice) && costPrice > retailPrice) {
    errors.push('costPrice cannot be greater than retailPrice');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      category,
      brand: asString(payload.brand).trim(),
      productName: asString(payload.productName).trim(),
      motherboardFormFactor: motherboardFormFactor || '',
      quantity: Number.isInteger(quantity) ? quantity : 0,
      taxIncluded,
      retailPrice: Number.isFinite(retailPrice) ? Math.trunc(retailPrice) : 0,
      costPrice: Number.isFinite(costPrice) ? Math.trunc(costPrice) : 0,
      note: asString(payload.note).trim(),
    },
  };
};

export const validateProcurementInput = (
  payload: MutablePayload,
): ValidationResult<ProcurementInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.date) || !DEAL_DATE_PATTERN.test(payload.date.trim())) {
    errors.push('date must match YYYY/MM/DD');
  }

  if (!isNonEmptyString(payload.peerName)) {
    errors.push('peerName is required');
  }

  if (!isNonEmptyString(payload.supplierName)) {
    errors.push('supplierName is required');
  }

  if (!isNonEmptyString(payload.source)) {
    errors.push('source is required');
  }

  const taxIncluded = typeof payload.taxIncluded === 'boolean' ? payload.taxIncluded : Boolean(payload.taxIncluded);
  const settledThisWeek = Boolean(payload.settledThisWeek);
  const items = parseProcurementItems(payload.items, taxIncluded);
  if (items.length === 0) {
    errors.push('items must contain at least one valid item');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      date: asString(payload.date).trim(),
      peerName: asString(payload.peerName).trim(),
      supplierName: asString(payload.supplierName).trim(),
      source: asString(payload.source).trim(),
      taxIncluded,
      settledThisWeek,
      items,
      note: asString(payload.note).trim(),
    },
  };
};

export const validatePersonalProcurementInput = (
  payload: MutablePayload,
): ValidationResult<PersonalProcurementInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.date) || !DEAL_DATE_PATTERN.test(payload.date.trim())) {
    errors.push('date must match YYYY/MM/DD');
  }

  if (!isNonEmptyString(payload.supplierName)) {
    errors.push('supplierName is required');
  }

  if (!isNonEmptyString(payload.source)) {
    errors.push('source is required');
  }

  const taxIncluded = typeof payload.taxIncluded === 'boolean' ? payload.taxIncluded : Boolean(payload.taxIncluded);
  const items = parseProcurementItems(payload.items, taxIncluded);
  if (items.length === 0) {
    errors.push('items must contain at least one valid item');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      date: asString(payload.date).trim(),
      supplierName: asString(payload.supplierName).trim(),
      source: asString(payload.source).trim(),
      taxIncluded,
      items,
      note: asString(payload.note).trim(),
    },
  };
};

export const validateSiteContentInput = (
  payload: MutablePayload,
): ValidationResult<SiteContentInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.homeHeroKicker)) {
    errors.push('homeHeroKicker is required');
  }

  if (!isNonEmptyString(payload.homeHeroTitle)) {
    errors.push('homeHeroTitle is required');
  }

  if (!isNonEmptyString(payload.homeHeroSubtitle)) {
    errors.push('homeHeroSubtitle is required');
  }

  if (!isNonEmptyString(payload.homeCategorySubtitle)) {
    errors.push('homeCategorySubtitle is required');
  }

  if (!isNonEmptyString(payload.homeBuildSubtitle)) {
    errors.push('homeBuildSubtitle is required');
  }

  if (!isNonEmptyString(payload.homeWorkflowSubtitle)) {
    errors.push('homeWorkflowSubtitle is required');
  }

  if (!isNonEmptyString(payload.homeContactSubtitle)) {
    errors.push('homeContactSubtitle is required');
  }

  if (!isNonEmptyString(payload.categoriesHeroSubtitle)) {
    errors.push('categoriesHeroSubtitle is required');
  }

  if (!isNonEmptyString(payload.categoriesPortfolioTitle)) {
    errors.push('categoriesPortfolioTitle is required');
  }

  if (!isNonEmptyString(payload.categoriesPortfolioSubtitle)) {
    errors.push('categoriesPortfolioSubtitle is required');
  }

  if (!isNonEmptyString(payload.brandHeroTitle)) {
    errors.push('brandHeroTitle is required');
  }

  if (!isNonEmptyString(payload.brandHeroSubtitle)) {
    errors.push('brandHeroSubtitle is required');
  }

  if (!isNonEmptyString(payload.footerAddress)) {
    errors.push('footerAddress is required');
  }

  if (!isNonEmptyString(payload.footerSlogan)) {
    errors.push('footerSlogan is required');
  }

  if (!isNonEmptyString(payload.contactAddress)) {
    errors.push('contactAddress is required');
  }

  if (!isNonEmptyString(payload.contactPhone)) {
    errors.push('contactPhone is required');
  }

  if (!isNonEmptyString(payload.contactLine)) {
    errors.push('contactLine is required');
  }

  const homeStats = parseSiteStats(payload.homeStats);
  if (homeStats.length === 0) {
    errors.push('homeStats must contain at least one item');
  }

  const categoriesQuickTags = uniqueTrimmedStrings(payload.categoriesQuickTags);
  if (categoriesQuickTags.length === 0) {
    errors.push('categoriesQuickTags must contain at least one item');
  }

  const categoriesBrandPortfolios = parseBrandPortfolios(payload.categoriesBrandPortfolios);
  if (categoriesBrandPortfolios.length === 0) {
    errors.push('categoriesBrandPortfolios must contain at least one item');
  }

  const shipmentTagCatalog = uniqueTrimmedStrings(payload.shipmentTagCatalog);
  if (shipmentTagCatalog.length === 0) {
    errors.push('shipmentTagCatalog must contain at least one item');
  }

  const shippingSteps = parseShippingSteps(payload.shippingSteps);
  if (shippingSteps.length === 0) {
    errors.push('shippingSteps must contain at least one item');
  }

  const serviceHighlights = uniqueTrimmedStrings(payload.serviceHighlights);
  if (serviceHighlights.length === 0) {
    errors.push('serviceHighlights must contain at least one item');
  }

  const testimonials = parseTestimonials(payload.testimonials);
  if (testimonials.length === 0) {
    errors.push('testimonials must contain at least one item');
  }

  const contactChannels = parseContactChannels(payload.contactChannels);
  if (contactChannels.length === 0) {
    errors.push('contactChannels must contain at least one item');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      homeHeroKicker: asString(payload.homeHeroKicker).trim(),
      homeHeroTitle: asString(payload.homeHeroTitle).trim(),
      homeHeroSubtitle: asString(payload.homeHeroSubtitle).trim(),
      homeCategorySubtitle: asString(payload.homeCategorySubtitle).trim(),
      homeBuildSubtitle: asString(payload.homeBuildSubtitle).trim(),
      homeWorkflowSubtitle: asString(payload.homeWorkflowSubtitle).trim(),
      homeContactSubtitle: asString(payload.homeContactSubtitle).trim(),
      homeStats,
      categoriesHeroSubtitle: asString(payload.categoriesHeroSubtitle).trim(),
      categoriesQuickTags,
      categoriesPortfolioTitle: asString(payload.categoriesPortfolioTitle).trim(),
      categoriesPortfolioSubtitle: asString(payload.categoriesPortfolioSubtitle).trim(),
      categoriesBrandPortfolios,
      brandHeroTitle: asString(payload.brandHeroTitle).trim(),
      brandHeroSubtitle: asString(payload.brandHeroSubtitle).trim(),
      shipmentTagCatalog,
      shippingSteps,
      serviceHighlights,
      testimonials,
      contactChannels,
      footerAddress: asString(payload.footerAddress).trim(),
      footerSlogan: asString(payload.footerSlogan).trim(),
      contactAddress: asString(payload.contactAddress).trim(),
      contactPhone: asString(payload.contactPhone).trim(),
      contactLine: asString(payload.contactLine).trim(),
    },
  };
};

export const validatePasswordChangeInput = (
  payload: MutablePayload,
): ValidationResult<PasswordChangeInput> => {
  const errors: string[] = [];

  if (!isNonEmptyString(payload.currentPassword)) {
    errors.push('currentPassword is required');
  }

  if (!isNonEmptyString(payload.newPassword)) {
    errors.push('newPassword is required');
  } else if (payload.newPassword.trim().length < 8) {
    errors.push('newPassword must be at least 8 characters');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      currentPassword: asString(payload.currentPassword),
      newPassword: asString(payload.newPassword),
    },
  };
};
