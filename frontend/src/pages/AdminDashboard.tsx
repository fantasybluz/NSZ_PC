import React from 'react';
import { Navigate } from 'react-router-dom';

import AdminShell from '../components/AdminShell';

import {
  clearAuth,
  getApiBaseUrl,
  getStoredToken,
  logoutAdmin,
  toApiErrorMessage,
} from '../lib/adminAuth';
import { getCategoryDetailPath } from '../lib/publicCategories';
import { getOrderDetailPath } from '../lib/publicOrders';
import {
  BUILD_PAGE_SIZE,
  CATEGORY_PAGE_SIZE,
  ORDER_PAGE_SIZE,
  createDefaultOrderStorageFields,
  createEmptyBrandPortfolio,
  createEmptyContactChannel,
  createEmptyShippingStep,
  createEmptySiteStat,
  createEmptyTestimonial,
  dedupeCaseInsensitive,
  defaultBuildForm,
  defaultCategoryForm,
  defaultOrderForm,
  defaultSiteContentForm,
  escapeHtml,
  formatCurrency,
  getQuoteNumber,
  isDealDateFormat,
  normalizeAdminCategory,
  normalizeAdminOrder,
  normalizeOrderStorageFields,
  orderPriceDistributionRanges,
  parsePipeRows,
  parseTagTextValue,
  parseYyyyMmDdDate,
  serializeCategoryFaqs,
  serializeOrderStorageFields,
  splitCommaList,
  splitLineList,
  splitStorageItems,
  splitTextList,
  statusLabelMap,
  statusOptions,
  type AdminBuild,
  type AdminCategory,
  type AdminCategoryFaq,
  type AdminContactChannel,
  type AdminOrder,
  type AdminShippingStep,
  type AdminSiteStat,
  adminTabFromHash,
  type AdminTabKey,
  type AdminTestimonial,
  type BuildFormState,
  type BuildsResponse,
  type CategoriesResponse,
  type CategoryFormState,
  type MeResponse,
  type OrderFormState,
  type OrderStatus,
  type OrdersResponse,
  type SiteContentFormState,
  type SiteContentResponse,
} from './adminDashboard/shared';

// 網站文字頁上方的快速跳轉（id 對到各區塊的 sc-<id>）
const SITE_CONTENT_SECTIONS: Array<[string, string]> = [
  ['home', '首頁'],
  ['categories', '分類總覽'],
  ['orders', '出機紀錄'],
  ['process', '流程與服務'],
  ['testimonials', '客戶回饋'],
  ['contact', '聯絡管道'],
  ['footer', 'Footer'],
];

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [loginUsername, setLoginUsername] = React.useState('');

  const [builds, setBuilds] = React.useState<AdminBuild[]>([]);
  const [buildsLoading, setBuildsLoading] = React.useState(false);
  const [buildsError, setBuildsError] = React.useState('');
  const [buildsSuccess, setBuildsSuccess] = React.useState('');
  const [buildForm, setBuildForm] = React.useState<BuildFormState>(defaultBuildForm);
  const [buildStorageFields, setBuildStorageFields] = React.useState<string[]>(createDefaultOrderStorageFields);
  const [buildSearchKeyword, setBuildSearchKeyword] = React.useState('');
  const [buildPage, setBuildPage] = React.useState(1);
  const [editingBuildId, setEditingBuildId] = React.useState<string | null>(null);
  const [isBuildEditModalOpen, setIsBuildEditModalOpen] = React.useState(false);
  const [isSavingBuild, setIsSavingBuild] = React.useState(false);
  const [deletingBuildId, setDeletingBuildId] = React.useState<string | null>(null);

  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState('');
  const [ordersSuccess, setOrdersSuccess] = React.useState('');
  const [orderForm, setOrderForm] = React.useState<OrderFormState>(defaultOrderForm);
  const [orderStorageFields, setOrderStorageFields] = React.useState<string[]>(createDefaultOrderStorageFields);
  const [orderSearchKeyword, setOrderSearchKeyword] = React.useState('');
  const [orderPage, setOrderPage] = React.useState(1);
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  const [isOrderEditModalOpen, setIsOrderEditModalOpen] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [deletingOrderId, setDeletingOrderId] = React.useState<string | null>(null);




  const [categories, setCategories] = React.useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(false);
  const [categoriesError, setCategoriesError] = React.useState('');
  const [categoriesSuccess, setCategoriesSuccess] = React.useState('');
  const [categoryForm, setCategoryForm] = React.useState<CategoryFormState>(defaultCategoryForm);
  const [categorySearchKeyword, setCategorySearchKeyword] = React.useState('');
  const [categoryPage, setCategoryPage] = React.useState(1);
  const [isCategoryCreateModalOpen, setIsCategoryCreateModalOpen] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = React.useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<string | null>(null);

  const [siteContentForm, setSiteContentForm] = React.useState<SiteContentFormState>(defaultSiteContentForm);
  const [siteContentLoading, setSiteContentLoading] = React.useState(false);
  const [siteContentError, setSiteContentError] = React.useState('');
  const [siteContentSuccess, setSiteContentSuccess] = React.useState('');
  const [isSavingSiteContent, setIsSavingSiteContent] = React.useState(false);
  const [activeAdminTab, setActiveAdminTabState] = React.useState<AdminTabKey>(() => adminTabFromHash(window.location.hash));
  const setActiveAdminTab = React.useCallback((key: AdminTabKey) => {
    setActiveAdminTabState(key);
    window.history.replaceState(null, '', `#${key}`);
    window.scrollTo({ top: 0 });
  }, []);

  const token = getStoredToken();
  const apiBaseUrl = getApiBaseUrl();

  const resetBuildForm = () => {
    setBuildForm(defaultBuildForm);
    setBuildStorageFields(createDefaultOrderStorageFields());
    setEditingBuildId(null);
    setIsBuildEditModalOpen(false);
  };

  const resetOrderForm = () => {
    setOrderForm(defaultOrderForm);
    setOrderStorageFields(createDefaultOrderStorageFields());
    setEditingOrderId(null);
    setIsOrderEditModalOpen(false);
  };




  const closeCategoryCreateModal = () => {
    setCategoryForm(defaultCategoryForm);
    setEditingCategoryId(null);
    setIsCategoryCreateModalOpen(false);
  };

  const loadBuilds = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setBuildsLoading(true);
    setBuildsError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/builds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as BuildsResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取推薦配單失敗'));
      }

      const list = (payload as BuildsResponse).data;
      setBuilds(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取推薦配單失敗';
      setBuildsError(message);
    } finally {
      setBuildsLoading(false);
    }
  }, [apiBaseUrl, token]);

  const loadOrders = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setOrdersLoading(true);
    setOrdersError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as OrdersResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取出機紀錄失敗'));
      }

      const list = (payload as OrdersResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminOrder(item))
            .filter((item): item is AdminOrder => item !== null)
        : [];
      setOrders(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取出機紀錄失敗';
      setOrdersError(message);
    } finally {
      setOrdersLoading(false);
    }
  }, [apiBaseUrl, token]);




  const loadCategories = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setCategoriesLoading(true);
    setCategoriesError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as CategoriesResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取分類總覽失敗'));
      }

      const list = (payload as CategoriesResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminCategory(item))
            .filter((item): item is AdminCategory => item !== null)
        : [];
      setCategories(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取分類總覽失敗';
      setCategoriesError(message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [apiBaseUrl, token]);

  const loadSiteContent = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setSiteContentLoading(true);
    setSiteContentError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/site-content`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as SiteContentResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取網站內容失敗'));
      }

      const data = (payload as SiteContentResponse).data;
      setSiteContentForm({
        homeHeroKicker: data.homeHeroKicker,
        homeHeroTitle: data.homeHeroTitle,
        homeHeroSubtitle: data.homeHeroSubtitle,
        homeCategorySubtitle: data.homeCategorySubtitle,
        homeBuildSubtitle: data.homeBuildSubtitle,
        homeWorkflowSubtitle: data.homeWorkflowSubtitle,
        homeContactSubtitle: data.homeContactSubtitle,
        homeStats: data.homeStats.map((item) => ({
          value: item.value,
          label: item.label,
        })),
        categoriesHeroSubtitle: data.categoriesHeroSubtitle,
        categoriesQuickTagsText: data.categoriesQuickTags.join('\n'),
        categoriesPortfolioTitle: data.categoriesPortfolioTitle,
        categoriesPortfolioSubtitle: data.categoriesPortfolioSubtitle,
        categoriesBrandPortfolios: data.categoriesBrandPortfolios.map((item) => ({
          id: item.id,
          name: item.name,
          tagline: item.tagline,
          focus: [...item.focus],
          tags: [...item.tags],
          images: [...item.images],
        })),
        brandHeroTitle: data.brandHeroTitle,
        brandHeroSubtitle: data.brandHeroSubtitle,
        shipmentTagCatalogText: Array.isArray(data.shipmentTagCatalog)
          ? data.shipmentTagCatalog.join('\n')
          : '',
        shippingSteps: data.shippingSteps.map((item) => ({
          title: item.title,
          description: item.description,
        })),
        serviceHighlightsText: data.serviceHighlights.join('\n'),
        testimonials: data.testimonials.map((item) => ({
          quote: item.quote,
          name: item.name,
          tag: item.tag,
        })),
        contactChannels: data.contactChannels.map((item) => ({
          icon: item.icon,
          label: item.label,
          value: item.value,
          href: item.href,
        })),
        footerAddress: data.footerAddress,
        footerSlogan: data.footerSlogan,
        contactAddress: data.contactAddress,
        contactPhone: data.contactPhone,
        contactLine: data.contactLine,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取網站內容失敗';
      setSiteContentError(message);
    } finally {
      setSiteContentLoading(false);
    }
  }, [apiBaseUrl, token]);

  React.useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json()) as MeResponse | unknown;
        if (!response.ok) {
          throw new Error(toApiErrorMessage(payload, '登入狀態已過期'));
        }
        const me = (payload as MeResponse).data;
        setLoginUsername(me?.username || '');

        await Promise.all([
          loadBuilds(),
          loadOrders(),
          loadCategories(),
          loadSiteContent(),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : '讀取帳號資訊失敗';
        setError(message);
        setLoginUsername('');
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap().catch(() => {
      setIsLoading(false);
      setError('系統錯誤，請重新登入');
      clearAuth();
    });
  }, [
    apiBaseUrl,
    loadBuilds,
    loadCategories,
    loadOrders,
    loadSiteContent,
    token,
  ]);

  React.useEffect(() => {
    if (
      !isBuildEditModalOpen &&
      !isOrderEditModalOpen &&
      !isCategoryCreateModalOpen
    ) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (isBuildEditModalOpen) {
        setBuildForm(defaultBuildForm);
        setBuildStorageFields(createDefaultOrderStorageFields());
        setEditingBuildId(null);
        setIsBuildEditModalOpen(false);
      }

      if (isOrderEditModalOpen) {
        setOrderForm(defaultOrderForm);
        setOrderStorageFields(createDefaultOrderStorageFields());
        setEditingOrderId(null);
        setIsOrderEditModalOpen(false);
      }

      if (isCategoryCreateModalOpen) {
        setCategoryForm(defaultCategoryForm);
        setEditingCategoryId(null);
        setIsCategoryCreateModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isBuildEditModalOpen,
    isOrderEditModalOpen,
    isCategoryCreateModalOpen,
  ]);

  React.useEffect(() => {
    setBuildPage(1);
  }, [buildSearchKeyword]);

  React.useEffect(() => {
    setCategoryPage(1);
  }, [categorySearchKeyword]);

  React.useEffect(() => {
    setOrderPage(1);
  }, [orderSearchKeyword]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logoutAdmin();
  };

  const handleBuildFieldChange = <K extends keyof BuildFormState>(
    key: K,
    value: BuildFormState[K],
  ) => {
    setBuildForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleBuildStorageFieldChange = (index: number, value: string) => {
    setBuildStorageFields((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddBuildStorageField = () => {
    setBuildStorageFields((prev) => [...prev, '']);
  };

  const handleRemoveBuildStorageField = (index: number) => {
    setBuildStorageFields((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleFieldChange = <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => {
    setOrderForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOrderImagesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    const readers = fileList.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((results) => {
      const nextImages = results.map((item) => item.trim()).filter(Boolean);
      if (nextImages.length === 0) {
        return;
      }

      setOrderForm((prev) => {
        const existing = splitTextList(prev.imagesText);
        const merged = [...existing, ...nextImages];
        return {
          ...prev,
          imagesText: merged.join('\n'),
        };
      });
    });
  };

  const handleToggleOrderTag = (tag: string) => {
    const normalizedTarget = tag.trim().toLowerCase();
    if (!normalizedTarget) {
      return;
    }

    setOrderForm((prev) => {
      const currentTags = parseTagTextValue(prev.tagsText);
      const exists = currentTags.some((item) => item.toLowerCase() === normalizedTarget);
      const nextTags = exists
        ? currentTags.filter((item) => item.toLowerCase() !== normalizedTarget)
        : [...currentTags, tag.trim()];

      return {
        ...prev,
        tagsText: nextTags.join('\n'),
      };
    });
  };

  const handleSyncShipmentTagCatalogFromOrders = () => {
    const orderTags = allExistingOrderTags;
    if (orderTags.length === 0) {
      setSiteContentError('目前沒有可同步的出機紀錄標籤');
      return;
    }

    setSiteContentError('');
    setSiteContentForm((prev) => {
      const currentTags = parseTagTextValue(prev.shipmentTagCatalogText);
      const merged = dedupeCaseInsensitive([...currentTags, ...orderTags]);

      return {
        ...prev,
        shipmentTagCatalogText: merged.join('\n'),
      };
    });
  };




  const handleOrderStorageFieldChange = (index: number, value: string) => {
    setOrderStorageFields((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleAddOrderStorageField = () => {
    setOrderStorageFields((prev) => [...prev, '']);
  };







  const handleRemoveOrderStorageField = (index: number) => {
    setOrderStorageFields((prev) => {
      if (prev.length <= 1) {
        return createDefaultOrderStorageFields();
      }

      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : createDefaultOrderStorageFields();
    });
  };

  const handleCategoryFieldChange = <K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) => {
    setCategoryForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSiteContentFieldChange = <K extends keyof SiteContentFormState>(
    key: K,
    value: SiteContentFormState[K],
  ) => {
    setSiteContentForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleHomeStatChange = (index: number, key: keyof AdminSiteStat, value: string) => {
    setSiteContentForm((prev) => ({
      ...prev,
      homeStats: prev.homeStats.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addHomeStat = () => {
    setSiteContentForm((prev) => ({
      ...prev,
      homeStats: [...prev.homeStats, createEmptySiteStat()],
    }));
  };

  const removeHomeStat = (index: number) => {
    setSiteContentForm((prev) => ({
      ...prev,
      homeStats: prev.homeStats.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleShippingStepChange = (
    index: number,
    key: keyof AdminShippingStep,
    value: string,
  ) => {
    setSiteContentForm((prev) => ({
      ...prev,
      shippingSteps: prev.shippingSteps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addShippingStep = () => {
    setSiteContentForm((prev) => ({
      ...prev,
      shippingSteps: [...prev.shippingSteps, createEmptyShippingStep()],
    }));
  };

  const removeShippingStep = (index: number) => {
    setSiteContentForm((prev) => ({
      ...prev,
      shippingSteps: prev.shippingSteps.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleTestimonialChange = (
    index: number,
    key: keyof AdminTestimonial,
    value: string,
  ) => {
    setSiteContentForm((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addTestimonial = () => {
    setSiteContentForm((prev) => ({
      ...prev,
      testimonials: [...prev.testimonials, createEmptyTestimonial()],
    }));
  };

  const removeTestimonial = (index: number) => {
    setSiteContentForm((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleContactChannelChange = (
    index: number,
    key: keyof AdminContactChannel,
    value: string,
  ) => {
    setSiteContentForm((prev) => ({
      ...prev,
      contactChannels: prev.contactChannels.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addContactChannel = () => {
    setSiteContentForm((prev) => ({
      ...prev,
      contactChannels: [...prev.contactChannels, createEmptyContactChannel()],
    }));
  };

  const removeContactChannel = (index: number) => {
    setSiteContentForm((prev) => ({
      ...prev,
      contactChannels: prev.contactChannels.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleBrandPortfolioTextFieldChange = (
    index: number,
    key: 'id' | 'name' | 'tagline',
    value: string,
  ) => {
    setSiteContentForm((prev) => ({
      ...prev,
      categoriesBrandPortfolios: prev.categoriesBrandPortfolios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const handleBrandPortfolioListFieldChange = (
    index: number,
    key: 'focus' | 'images' | 'tags',
    value: string,
  ) => {
    const nextList = splitCommaList(value);
    setSiteContentForm((prev) => ({
      ...prev,
      categoriesBrandPortfolios: prev.categoriesBrandPortfolios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: nextList } : item,
      ),
    }));
  };

  const addBrandPortfolio = () => {
    setSiteContentForm((prev) => ({
      ...prev,
      categoriesBrandPortfolios: [...prev.categoriesBrandPortfolios, createEmptyBrandPortfolio()],
    }));
  };

  const removeBrandPortfolio = (index: number) => {
    setSiteContentForm((prev) => ({
      ...prev,
      categoriesBrandPortfolios: prev.categoriesBrandPortfolios.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const openCreateBuildModal = () => {
    setBuildsError('');
    setBuildsSuccess('');
    setBuildForm(defaultBuildForm);
    setBuildStorageFields(createDefaultOrderStorageFields());
    setEditingBuildId(null);
    setIsBuildEditModalOpen(true);
  };

  const openCreateCategoryModal = () => {
    setCategoriesError('');
    setCategoriesSuccess('');
    setCategoryForm(defaultCategoryForm);
    setEditingCategoryId(null);
    setIsCategoryCreateModalOpen(true);
  };

  const openCreateOrderModal = () => {
    setOrdersError('');
    setOrdersSuccess('');
    setOrderForm(defaultOrderForm);
    setOrderStorageFields(createDefaultOrderStorageFields());
    setEditingOrderId(null);
    setIsOrderEditModalOpen(true);
  };




  const handleSaveSiteContent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSiteContentSuccess('');

    if (!token) {
      setSiteContentError('登入狀態已失效，請重新登入');
      return;
    }

    const requiredFields: Array<{ value: string; label: string }> = [
      { value: siteContentForm.homeHeroKicker, label: '首頁主標題標籤' },
      { value: siteContentForm.homeHeroTitle, label: '首頁主標題' },
      { value: siteContentForm.homeHeroSubtitle, label: '首頁主標題描述' },
      { value: siteContentForm.homeCategorySubtitle, label: '首頁熱門分類描述' },
      { value: siteContentForm.homeBuildSubtitle, label: '首頁推薦配單描述' },
      { value: siteContentForm.homeWorkflowSubtitle, label: '首頁出貨流程描述' },
      { value: siteContentForm.homeContactSubtitle, label: '首頁聯絡我們描述' },
      { value: siteContentForm.categoriesHeroSubtitle, label: '分類總覽說明' },
      { value: siteContentForm.categoriesPortfolioTitle, label: '分類總覽品牌作品集標題' },
      { value: siteContentForm.categoriesPortfolioSubtitle, label: '分類總覽品牌作品集說明' },
      { value: siteContentForm.brandHeroTitle, label: '出機紀錄區塊標題' },
      { value: siteContentForm.brandHeroSubtitle, label: '出機紀錄區塊說明' },
      { value: siteContentForm.footerAddress, label: 'Footer 地址' },
      { value: siteContentForm.footerSlogan, label: 'Footer 標語' },
      { value: siteContentForm.contactAddress, label: '聯絡地址' },
      { value: siteContentForm.contactPhone, label: '聯絡電話' },
      { value: siteContentForm.contactLine, label: '聯絡 LINE' },
    ];

    const missing = requiredFields.find((item) => !item.value.trim());
    if (missing) {
      setSiteContentError(`請填寫 ${missing.label}`);
      return;
    }

    const homeStats = siteContentForm.homeStats
      .map((item) => ({
        value: item.value.trim(),
        label: item.label.trim(),
      }))
      .filter((item) => item.value && item.label);

    if (homeStats.length === 0) {
      setSiteContentError('首頁統計至少需要一筆');
      return;
    }

    const shippingSteps = siteContentForm.shippingSteps
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      }))
      .filter((item) => item.title && item.description);

    if (shippingSteps.length === 0) {
      setSiteContentError('流程細節至少需要一筆');
      return;
    }

    const testimonials = siteContentForm.testimonials
      .map((item) => ({
        quote: item.quote.trim(),
        name: item.name.trim(),
        tag: item.tag.trim(),
      }))
      .filter((item) => item.quote && item.name && item.tag);

    if (testimonials.length === 0) {
      setSiteContentError('客戶回饋至少需要一筆');
      return;
    }

    const contactChannels = siteContentForm.contactChannels
      .map((item) => ({
        icon: item.icon.trim(),
        label: item.label.trim(),
        value: item.value.trim(),
        href: item.href.trim(),
      }))
      .filter((item) => item.icon && item.label && item.value && item.href);

    if (contactChannels.length === 0) {
      setSiteContentError('聯絡管道至少需要一筆');
      return;
    }

    const categoriesBrandPortfolios = siteContentForm.categoriesBrandPortfolios
      .map((item) => ({
        id: item.id.trim(),
        name: item.name.trim(),
        tagline: item.tagline.trim(),
        focus: item.focus.map((value) => value.trim()).filter(Boolean),
        images: item.images.map((value) => value.trim()).filter(Boolean),
        tags: item.tags.map((value) => value.trim()).filter(Boolean),
      }))
      .filter((item) => item.id && item.name && item.tagline);

    if (categoriesBrandPortfolios.length === 0) {
      setSiteContentError('品牌作品集至少需要一筆');
      return;
    }

    const invalidPortfolio = categoriesBrandPortfolios.find(
      (item) => item.focus.length === 0 || item.images.length === 0 || item.tags.length === 0,
    );
    if (invalidPortfolio) {
      setSiteContentError(`品牌作品集「${invalidPortfolio.name}」需至少一個重點、一張圖片與一個標籤`);
      return;
    }

    const categoriesQuickTags = splitLineList(siteContentForm.categoriesQuickTagsText);
    const shipmentTagCatalog = parseTagTextValue(siteContentForm.shipmentTagCatalogText);
    const serviceHighlights = splitLineList(siteContentForm.serviceHighlightsText);

    if (categoriesQuickTags.length === 0) {
      setSiteContentError('分類總覽熱門標籤至少需要一筆');
      return;
    }

    if (shipmentTagCatalog.length === 0) {
      setSiteContentError('出機紀錄標籤庫至少需要一筆');
      return;
    }

    if (serviceHighlights.length === 0) {
      setSiteContentError('服務項目至少需要一筆');
      return;
    }

    setIsSavingSiteContent(true);
    setSiteContentError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/site-content`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeHeroKicker: siteContentForm.homeHeroKicker.trim(),
          homeHeroTitle: siteContentForm.homeHeroTitle.trim(),
          homeHeroSubtitle: siteContentForm.homeHeroSubtitle.trim(),
          homeCategorySubtitle: siteContentForm.homeCategorySubtitle.trim(),
          homeBuildSubtitle: siteContentForm.homeBuildSubtitle.trim(),
          homeWorkflowSubtitle: siteContentForm.homeWorkflowSubtitle.trim(),
          homeContactSubtitle: siteContentForm.homeContactSubtitle.trim(),
          homeStats,
          categoriesHeroSubtitle: siteContentForm.categoriesHeroSubtitle.trim(),
          categoriesQuickTags,
          categoriesPortfolioTitle: siteContentForm.categoriesPortfolioTitle.trim(),
          categoriesPortfolioSubtitle: siteContentForm.categoriesPortfolioSubtitle.trim(),
          categoriesBrandPortfolios,
          brandHeroTitle: siteContentForm.brandHeroTitle.trim(),
          brandHeroSubtitle: siteContentForm.brandHeroSubtitle.trim(),
          shipmentTagCatalog,
          shippingSteps,
          serviceHighlights,
          testimonials,
          contactChannels,
          footerAddress: siteContentForm.footerAddress.trim(),
          footerSlogan: siteContentForm.footerSlogan.trim(),
          contactAddress: siteContentForm.contactAddress.trim(),
          contactPhone: siteContentForm.contactPhone.trim(),
          contactLine: siteContentForm.contactLine.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '更新網站內容失敗'));
      }

      setSiteContentSuccess('網站內容已更新，前台頁面會立即同步。');
      await loadSiteContent();
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新網站內容失敗';
      setSiteContentError(message);
    } finally {
      setIsSavingSiteContent(false);
    }
  };

  const handleSaveBuild = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBuildsSuccess('');

    const name = buildForm.name.trim();
    const description = buildForm.description.trim();
    const detailIntro = buildForm.detailIntro.trim() || description;
    const requirementIntro = buildForm.requirementIntro.trim();
    const youtubeEmbedUrl = buildForm.youtubeEmbedUrl.trim();
    const image = buildForm.image.trim();
    const badge = buildForm.badge.trim();
    const dealDate = buildForm.dealDate.trim();
    const cpu = buildForm.cpu.trim();
    const motherboard = buildForm.motherboard.trim();
    const ram = buildForm.ram.trim();
    const storage = serializeOrderStorageFields(buildStorageFields);
    const gpu = buildForm.gpu.trim();
    const psu = buildForm.psu.trim();
    const pcCase = buildForm.pcCase.trim();
    const tags = splitTextList(buildForm.tagsText);
    const accessories = splitTextList(buildForm.accessoriesText);
    const specs = splitTextList(buildForm.specsText);
    const price = Number(buildForm.priceText);

    if (!name || !description || !image) {
      setBuildsError('請完整填寫名稱、描述與圖片路徑');
      return;
    }

    if (!requirementIntro) {
      setBuildsError('請填寫需求介紹');
      return;
    }

    if (!cpu || !motherboard || !ram || !storage || !gpu || !psu || !pcCase) {
      setBuildsError('請完整填寫 CPU、主機板、RAM、硬碟、顯示卡、電源供應器、機殼');
      return;
    }

    if (!tags.length) {
      setBuildsError('請至少提供一筆配單標籤');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setBuildsError('價格需為大於 0 的數字');
      return;
    }

    if (!isDealDateFormat(dealDate)) {
      setBuildsError('成交日期格式需為 YYYY/MM/DD');
      return;
    }

    if (!token) {
      setBuildsError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingBuild(true);
    setBuildsError('');

    try {
      const isEdit = Boolean(editingBuildId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/builds/${editingBuildId}`
        : `${apiBaseUrl}/api/admin/builds`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          detailIntro,
          requirementIntro,
          youtubeEmbedUrl,
          price,
          dealDate,
          image,
          badge,
          tags,
          cpu,
          motherboard,
          ram,
          storage,
          gpu,
          psu,
          pcCase,
          accessories,
          specs,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新推薦配單失敗' : '新增推薦配單失敗'));
      }

      setBuildsSuccess(isEdit ? '推薦配單已更新' : '推薦配單已新增');
      resetBuildForm();
      await loadBuilds();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存推薦配單失敗';
      setBuildsError(message);
    } finally {
      setIsSavingBuild(false);
    }
  };

  const handleSaveOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrdersSuccess('');
    const storage = serializeOrderStorageFields(orderStorageFields);
    const salePrice = Number(orderForm.salePriceText.trim());
    const serviceFee = Number(orderForm.serviceFeeText.trim());
    const requirementIntro = orderForm.requirementIntro.trim();
    const youtubeEmbedUrl = orderForm.youtubeEmbedUrl.trim();
    const tags = parseTagTextValue(orderForm.tagsText);
    const images = splitTextList(orderForm.imagesText);

    if (
      !orderForm.date.trim() ||
      !orderForm.item.trim() ||
      !requirementIntro ||
      tags.length === 0 ||
      !orderForm.location.trim() ||
      !orderForm.salePriceText.trim() ||
      !orderForm.serviceFeeText.trim() ||
      !orderForm.cpu.trim() ||
      !orderForm.motherboard.trim() ||
      !orderForm.ram.trim() ||
      !storage ||
      !orderForm.gpu.trim() ||
      !orderForm.psu.trim() ||
      !orderForm.cooler.trim() ||
      !orderForm.pcCase.trim()
    ) {
      setOrdersError(
        '請完整填寫日期、品項、客戶需求、標籤、地區、售價、服務費用與 CPU/主機板/RAM/硬碟/顯示卡/散熱器/電源供應器/機殼',
      );
      return;
    }

    if (!Number.isFinite(salePrice) || salePrice < 0) {
      setOrdersError('售價需為大於或等於 0 的數字');
      return;
    }

    if (!Number.isFinite(serviceFee) || serviceFee < 0) {
      setOrdersError('服務費用需為大於或等於 0 的數字');
      return;
    }

    const managedTagSet = new Set(managedShipmentTagCatalog.map((tag) => tag.toLowerCase()));
    const unmanagedTags = tags.filter((tag) => !managedTagSet.has(tag.toLowerCase()));
    if (unmanagedTags.length > 0) {
      setOrdersError(`以下標籤尚未加入統一標籤庫：${unmanagedTags.join('、')}，請先至網站內容管理新增`);
      return;
    }

    if (!token) {
      setOrdersError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingOrder(true);
    setOrdersError('');

    try {
      const isEdit = Boolean(editingOrderId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/orders/${editingOrderId}`
        : `${apiBaseUrl}/api/admin/orders`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: orderForm.date,
          item: orderForm.item,
          requirementIntro,
          youtubeEmbedUrl,
          tags,
          images,
          location: orderForm.location,
          salePrice: Math.trunc(salePrice),
          serviceFee: Math.trunc(serviceFee),
          status: orderForm.status,
          cpu: orderForm.cpu,
          motherboard: orderForm.motherboard,
          ram: orderForm.ram,
          storage,
          gpu: orderForm.gpu,
          psu: orderForm.psu,
          cooler: orderForm.cooler,
          pcCase: orderForm.pcCase,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新失敗' : '新增失敗'));
      }

      setOrdersSuccess(isEdit ? '出機紀錄已更新' : '出機紀錄已新增');
      resetOrderForm();
      await loadOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存出機紀錄失敗';
      setOrdersError(message);
    } finally {
      setIsSavingOrder(false);
    }
  };




  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoriesSuccess('');

    const title = categoryForm.title.trim();
    const summary = categoryForm.summary.trim();
    const primaryCategory = categoryForm.primaryCategory.trim();
    const secondaryCategory = categoryForm.secondaryCategory.trim();
    const tags = splitTextList(categoryForm.tagsText);
    const points = splitTextList(categoryForm.pointsText);
    const detailIntro = categoryForm.detailIntro.trim();
    const detailHeroImage = categoryForm.detailHeroImage.trim();
    const detailRecommendations = splitTextList(categoryForm.detailRecommendationsText);
    let detailFaqs: AdminCategoryFaq[] = [];

    try {
      detailFaqs = parsePipeRows(categoryForm.detailFaqsText, 2, '常見問題').map(([question, answer]) => ({
        question,
        answer,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '常見問題格式錯誤';
      setCategoriesError(message);
      return;
    }

    if (!title || !summary || !primaryCategory || !secondaryCategory || points.length === 0 || !detailIntro || !detailHeroImage) {
      setCategoriesError('請填寫標題、簡述、主分類、次分類、需求說明、介紹圖片，並至少提供一個重點');
      return;
    }

    if (tags.length === 0) {
      setCategoriesError('分類標籤至少需要一筆');
      return;
    }

    if (detailRecommendations.length === 0) {
      setCategoriesError('建議規劃至少需要一筆');
      return;
    }

    if (!token) {
      setCategoriesError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingCategory(true);
    setCategoriesError('');

    try {
      const isEdit = Boolean(editingCategoryId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/categories/${editingCategoryId}`
        : `${apiBaseUrl}/api/admin/categories`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          summary,
          primaryCategory,
          secondaryCategory,
          tags,
          points,
          detailIntro,
          detailHeroImage,
          detailRecommendations,
          detailFaqs,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新分類總覽失敗' : '新增分類總覽失敗'));
      }

      setCategoriesSuccess(isEdit ? '分類總覽已更新。' : '分類總覽已新增，前台會自動出現新的前往分類頁面。');
      closeCategoryCreateModal();
      await loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存分類總覽失敗';
      setCategoriesError(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const startEditBuild = (build: AdminBuild) => {
    setBuildsSuccess('');
    setBuildsError('');
    setEditingBuildId(build.id);
    setIsBuildEditModalOpen(true);
    setBuildForm({
      name: build.name,
      description: build.description,
      detailIntro: build.detailIntro || build.description,
      requirementIntro: build.requirementIntro || '此配單會先依用途與預算拆解需求，再安排升級路線。',
      youtubeEmbedUrl: build.youtubeEmbedUrl || '',
      priceText: String(build.price),
      dealDate: build.dealDate || '',
      image: build.image,
      badge: build.badge || '',
      cpu: build.cpu || '',
      motherboard: build.motherboard || '',
      ram: build.ram || '',
      storage: build.storage || '',
      gpu: build.gpu || '',
      psu: build.psu || '',
      pcCase: build.pcCase || '',
      tagsText: (build.tags || []).join('\n'),
      accessoriesText: (build.accessories || []).join('\n'),
      specsText: build.specs.join('\n'),
    });
    setBuildStorageFields(normalizeOrderStorageFields(build.storage || ''));
  };

  const startEditOrder = (order: AdminOrder) => {
    setOrdersSuccess('');
    setOrdersError('');
    setEditingOrderId(order.id);
    setIsOrderEditModalOpen(true);
    setOrderForm({
      date: order.date,
      item: order.item,
      requirementIntro: order.requirementIntro,
      youtubeEmbedUrl: order.youtubeEmbedUrl || '',
      tagsText: (order.tags || []).join('\n'),
      imagesText: (order.images || []).join('\n'),
      location: order.location,
      salePriceText: String(order.salePrice),
      serviceFeeText: String(order.serviceFee ?? 0),
      status: order.status,
      cpu: order.cpu || '',
      motherboard: order.motherboard || '',
      ram: order.ram || '',
      storage: order.storage || '',
      gpu: order.gpu || '',
      psu: order.psu || '',
      cooler: order.cooler || '',
      pcCase: order.pcCase || '',
    });
    setOrderStorageFields(normalizeOrderStorageFields(order.storage || ''));
  };

  const handleGenerateOrderQuotation = (order: AdminOrder) => {
    setOrdersError('');
    setOrdersSuccess('');

    const quoteWindow = window.open('', 'nszpc-quotation', 'popup=yes,width=980,height=860');
    if (!quoteWindow) {
      setOrdersError('無法開啟估價單視窗，請確認瀏覽器沒有封鎖彈出視窗');
      return;
    }

    // Keep the new window detached from current page while still allowing document write.
    try {
      quoteWindow.opener = null;
    } catch {
      // Ignore when browser does not allow assigning opener.
    }

    const quoteNumber = getQuoteNumber(order);
    const generatedAt = new Date().toLocaleString('zh-TW', { hour12: false });
    const storageItems = splitStorageItems(order.storage || '');
    const quoteTotal = order.salePrice + (order.serviceFee || 0);
    const storageLabel =
      storageItems.length > 0
        ? Object.entries(
            storageItems.reduce<Record<string, number>>((acc, item) => {
              const key = item.trim();
              if (!key) {
                return acc;
              }
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {}),
          )
            .map(([item, count]) => (count > 1 ? `${item} x${count}` : item))
            .join(', ')
        : order.storage || '待補充';
    const storageQty = storageItems.length > 0 ? String(storageItems.length) : '1';
    const quoteSpecs = [
      { part: 'CPU', spec: order.cpu || '待補充', qty: '1', unit: '-' },
      { part: '主機板', spec: order.motherboard || '待補充', qty: '1', unit: '-' },
      { part: 'RAM', spec: order.ram || '待補充', qty: '1', unit: '-' },
      { part: '硬碟', spec: storageLabel, qty: storageQty, unit: '-' },
      { part: '顯示卡', spec: order.gpu || '待補充', qty: '1', unit: '-' },
      { part: '散熱器', spec: order.cooler || '待補充', qty: '1', unit: '-' },
      { part: '電源供應器', spec: order.psu || '待補充', qty: '1', unit: '-' },
      { part: '機殼', spec: order.pcCase || '待補充', qty: '1', unit: '-' },
      { part: '服務費用', spec: formatCurrency(order.serviceFee || 0), qty: '1', unit: formatCurrency(order.serviceFee || 0) },
    ];
    const quoteSpecsRows = quoteSpecs
      .map(
        (item) =>
          `<tr>
            <td>${escapeHtml(item.part)}</td>
            <td>${escapeHtml(item.spec)}</td>
            <td class="quote-qty">${escapeHtml(item.qty)}</td>
            <td class="quote-qty">${escapeHtml(item.unit)}</td>
          </tr>`,
      )
      .join('');

    const quoteHtml = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>估價單 ${escapeHtml(quoteNumber)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: "Noto Sans TC", "PingFang TC", sans-serif;
        color: #1f2d3d;
        background: #f4f7fb;
      }
      .quote-page {
        max-width: 900px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #d5deea;
        border-radius: 12px;
        box-shadow: 0 10px 24px rgba(17, 39, 66, 0.08);
        padding: 28px;
      }
      .quote-actions {
        margin-bottom: 16px;
        display: flex;
        gap: 10px;
      }
      .quote-actions button {
        border: 1px solid #b5c6dd;
        border-radius: 8px;
        background: #fff;
        color: #1f2d3d;
        padding: 8px 14px;
        cursor: pointer;
      }
      .quote-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 2px solid #12324d;
        padding-bottom: 12px;
      }
      .quote-title {
        margin: 0;
        font-size: 28px;
        letter-spacing: 0.06em;
      }
      .quote-sub {
        margin: 6px 0 0;
        color: #35506f;
      }
      .quote-grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .quote-box {
        border: 1px solid #d5deea;
        border-radius: 10px;
        padding: 12px;
        background: #f9fcff;
      }
      .quote-box h3 {
        margin: 0 0 8px;
        font-size: 14px;
        color: #12324d;
      }
      .quote-box p {
        margin: 4px 0;
        line-height: 1.45;
      }
      .quote-table {
        margin-top: 18px;
        width: 100%;
        border-collapse: collapse;
      }
      .quote-table th,
      .quote-table td {
        border: 1px solid #d5deea;
        padding: 10px 12px;
        text-align: left;
        vertical-align: top;
      }
      .quote-table thead th {
        background: #f0f5fb;
        font-weight: 600;
      }
      .quote-table tbody td:first-child {
        width: 150px;
        background: #f7fafc;
        font-weight: 600;
      }
      .quote-table tbody td:last-child {
        width: 90px;
        text-align: center;
      }
      .quote-table tbody td:nth-child(3) {
        width: 70px;
        text-align: center;
      }
      .quote-footer {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        align-items: end;
      }
      .quote-stamp {
        width: 210px;
        height: 140px;
        border: 2px dashed #b8c7dc;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8aa0b8;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-align: center;
        background: #fbfdff;
      }
      .quote-totals {
        display: grid;
        gap: 6px;
      }
      .quote-total {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
      }
      .quote-total strong {
        font-size: 22px;
        color: #12324d;
      }
      .quote-note {
        margin-top: 14px;
        color: #4e637d;
        line-height: 1.5;
      }
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          background: #fff;
          padding: 0;
        }
        .quote-page {
          border: 0;
          box-shadow: none;
          border-radius: 0;
          max-width: none;
          width: 210mm;
          height: 297mm;
          padding: 12mm 10mm 40mm;
        }
        .quote-footer {
          position: fixed;
          bottom: 10mm;
          left: 10mm;
          right: 10mm;
        }
        .quote-title {
          font-size: 24px;
        }
        .quote-grid {
          margin-top: 12px;
          gap: 10px;
        }
        .quote-box {
          padding: 10px;
        }
        .quote-box p {
          margin: 3px 0;
        }
        .quote-table {
          font-size: 12px;
        }
        .quote-table th,
        .quote-table td {
          padding: 6px 8px;
        }
        .quote-total strong {
          font-size: 20px;
        }
        .quote-note {
          margin-top: 10px;
          font-size: 12px;
        }
        .quote-table,
        .quote-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .quote-actions {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <section class="quote-page">
      <div class="quote-actions">
        <button type="button" onclick="window.print()">列印 / 另存 PDF</button>
        <button type="button" onclick="window.close()">關閉</button>
      </div>
      <header class="quote-head">
        <div>
          <h1 class="quote-title">估價單</h1>
          <p class="quote-sub">星辰電腦 NSZPC</p>
        </div>
        <div>
          <p>估價單號：${escapeHtml(quoteNumber)}</p>
          <p>建立時間：${escapeHtml(generatedAt)}</p>
          <p>交付狀態：${escapeHtml(statusLabelMap[order.status])}</p>
        </div>
      </header>
      <div class="quote-grid">
        <article class="quote-box">
          <h3>客戶需求</h3>
          <p>品項：${escapeHtml(order.item)}</p>
          <p>需求地區：${escapeHtml(order.location)}</p>
          <p>出貨日期：${escapeHtml(order.date)}</p>
        </article>
        <article class="quote-box">
          <h3>店家資訊</h3>
          <p>地址：${escapeHtml(siteContentForm.contactAddress || '待補充')}</p>
          <p>電話：${escapeHtml(siteContentForm.contactPhone || '待補充')}</p>
          <p>LINE：${escapeHtml(siteContentForm.contactLine || '待補充')}</p>
        </article>
      </div>
      <table class="quote-table">
        <thead>
          <tr>
            <th>品項</th>
            <th>名稱</th>
            <th>數量</th>
            <th>單價</th>
          </tr>
        </thead>
        <tbody>
          ${quoteSpecsRows}
        </tbody>
      </table>
      <div class="quote-footer">
        <div class="quote-stamp">發票章／公司章</div>
        <div class="quote-totals">
          <div class="quote-total">
            <span>主機售價(未稅)</span>
            <strong>${escapeHtml(formatCurrency(order.salePrice))}</strong>
          </div>
          <div class="quote-total">
            <span>估價總額(含稅價格)</span>
            <strong>${escapeHtml(formatCurrency(quoteTotal))}</strong>
          </div>
        </div>
      </div>
      <p class="quote-note">
        此估價單由後台「出機紀錄」資料自動產出，僅供報價與規格確認使用；實際交期與付款方式請以雙方最終確認為準。
      </p>
    </section>
  </body>
</html>`;

    try {
      quoteWindow.document.open();
      quoteWindow.document.write(quoteHtml);
      quoteWindow.document.close();
      quoteWindow.focus();
      setOrdersSuccess(`已為「${order.item}」產出估價單`);
    } catch {
      quoteWindow.close();
      setOrdersError('估價單產生失敗，請再試一次。');
    }
  };

  const handleGenerateOrderChecklist = (order: AdminOrder) => {
    setOrdersError('');
    setOrdersSuccess('');

    const checklistWindow = window.open('', 'nszpc-checklist', 'popup=yes,width=980,height=920');
    if (!checklistWindow) {
      setOrdersError('無法開啟出機檢查單視窗，請確認瀏覽器沒有封鎖彈出視窗');
      return;
    }

    try {
      checklistWindow.opener = null;
    } catch {
      // Ignore when browser does not allow assigning opener.
    }

    const checklistNumber = getQuoteNumber(order).replace('QT-', 'QC-');
    const generatedAt = new Date().toLocaleString('zh-TW', { hour12: false });
    const storageItems = splitStorageItems(order.storage || '');
    const storageLabel =
      storageItems.length > 0
        ? Object.entries(
            storageItems.reduce<Record<string, number>>((acc, item) => {
              const key = item.trim();
              if (!key) {
                return acc;
              }
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {}),
          )
            .map(([item, count]) => (count > 1 ? `${item} x${count}` : item))
            .join(', ')
        : order.storage || '待補充';
    const checklistSpecs = [
      { part: 'CPU', spec: order.cpu || '待補充' },
      { part: '主機板', spec: order.motherboard || '待補充' },
      { part: 'RAM', spec: order.ram || '待補充' },
      { part: '硬碟', spec: storageLabel },
      { part: '顯示卡', spec: order.gpu || '待補充' },
      { part: '散熱器', spec: order.cooler || '待補充' },
      { part: '電源供應器', spec: order.psu || '待補充' },
      { part: '機殼', spec: order.pcCase || '待補充' },
    ];
    const checklistSpecsRows = (() => {
      const rows: string[] = [];
      for (let index = 0; index < checklistSpecs.length; index += 2) {
        const left = checklistSpecs[index];
        const right = checklistSpecs[index + 1];
        rows.push(
          `<tr>
            <th>${escapeHtml(left.part)}</th>
            <td>${escapeHtml(left.spec)}</td>
            ${
              right
                ? `<th>${escapeHtml(right.part)}</th><td>${escapeHtml(right.spec)}</td>`
                : '<th></th><td></td>'
            }
          </tr>`,
        );
      }
      return rows.join('');
    })();

    const checklistHtml = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>出機檢查單 ${escapeHtml(checklistNumber)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: "Noto Sans TC", "PingFang TC", sans-serif;
        color: #1f2d3d;
        background: #f4f7fb;
      }
      .checklist-page {
        max-width: 900px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #d5deea;
        border-radius: 12px;
        box-shadow: 0 10px 24px rgba(17, 39, 66, 0.08);
        padding: 28px;
      }
      .checklist-actions {
        margin-bottom: 16px;
        display: flex;
        gap: 10px;
      }
      .checklist-actions button {
        border: 1px solid #b5c6dd;
        border-radius: 8px;
        background: #fff;
        color: #1f2d3d;
        padding: 8px 14px;
        cursor: pointer;
      }
      .checklist-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 2px solid #12324d;
        padding-bottom: 12px;
      }
      .checklist-kicker {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #5c7694;
      }
      .checklist-title {
        margin: 6px 0 0;
        font-size: 28px;
        letter-spacing: 0.06em;
      }
      .checklist-sub {
        margin: 6px 0 0;
        color: #35506f;
      }
      .checklist-meta p {
        margin: 4px 0;
        text-align: right;
      }
      .checklist-grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .checklist-box {
        border: 1px solid #d5deea;
        border-radius: 10px;
        padding: 12px;
        background: #f9fcff;
      }
      .checklist-box h3 {
        margin: 0 0 8px;
        font-size: 14px;
        color: #12324d;
      }
      .checklist-box p {
        margin: 4px 0;
        line-height: 1.45;
      }
      .checklist-section-title {
        margin: 12px 0 6px;
        font-size: 16px;
        color: #12324d;
      }
      .checklist-specs {
        width: 100%;
        border-collapse: collapse;
        font-size: 12.5px;
      }
      .checklist-specs th,
      .checklist-specs td {
        border: 1px solid #d5deea;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
        line-height: 1.35;
      }
      .checklist-specs th {
        width: 110px;
        background: #f0f5fb;
      }
      .checklist-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
        font-size: 12.5px;
        border: 1px solid #d5deea;
        border-radius: 10px;
        overflow: hidden;
      }
      .checklist-table th,
      .checklist-table td {
        border: 1px solid #d5deea;
        padding: 7px 9px;
        text-align: left;
        vertical-align: middle;
      }
      .checklist-table th {
        background: #f0f5fb;
        color: #12324d;
        font-weight: 600;
      }
      .checklist-table .section {
        background: #e9f2fb;
        color: #12324d;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .checklist-table .key-cell {
        background: #f7faff;
        font-weight: 600;
        color: #2a3f5c;
        width: 120px;
      }
      .checklist-table .fill-cell {
        height: 28px;
      }
      .checklist-table .fill-line {
        display: block;
        width: 100%;
        height: 16px;
        border-bottom: 1px solid #7b8da3;
      }
      .checklist-table .muted {
        color: #5f7187;
        font-size: 12px;
      }
      .checklist-table .center {
        text-align: center;
      }
      .line {
        border-bottom: 1px solid #7b8da3;
        display: inline-block;
        min-width: 140px;
        height: 1em;
        vertical-align: baseline;
      }
      .checklist-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
        margin-top: 16px;
        font-size: 13px;
      }
      .checklist-date {
        font-weight: 500;
        color: #22364f;
      }
      .checklist-signature {
        font-weight: 500;
        color: #22364f;
      }
      .checklist-social {
        text-align: right;
        line-height: 1.6;
        white-space: nowrap;
      }
      .checklist-note {
        margin-top: 12px;
        text-align: left;
        font-size: 13px;
        color: #4e637d;
      }
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          background: #fff;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .checklist-page {
          border: 0;
          box-shadow: none;
          border-radius: 0;
          max-width: none;
          width: 210mm;
          min-height: 297mm;
          height: auto;
          padding: 16mm 10mm 18mm;
          overflow: visible;
        }
        .checklist-grid {
          display: block;
        }
        .checklist-box {
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .checklist-title {
          font-size: 24px;
        }
        .checklist-head {
          margin-top: 6mm;
        }
        .checklist-grid {
          margin-top: 12px;
          gap: 10px;
        }
        .checklist-box {
          padding: 10px;
        }
        .checklist-box p {
          margin: 3px 0;
        }
        .checklist-section-title {
          margin: 12px 0 6px;
          font-size: 14px;
        }
        .checklist-specs,
        .checklist-table {
          font-size: 10.5px;
        }
        .checklist-specs th,
        .checklist-specs td,
        .checklist-table th,
        .checklist-table td {
          padding: 4px 6px;
        }
        .checklist-table {
          border-radius: 0;
          overflow: visible;
        }
        .checklist-table th,
        .checklist-table td {
          border-color: #a8b8cc;
        }
        .checklist-table .muted {
          font-size: 10px;
        }
        .checklist-footer {
          margin-top: 12px;
          gap: 16px;
        }
        .checklist-note {
          margin-top: 8px;
          font-size: 12px;
        }
        .checklist-date {
          position: fixed;
          bottom: 8mm;
          left: 10mm;
          font-size: 12px;
        }
        .checklist-signature {
          position: fixed;
          bottom: 8mm;
          right: 10mm;
          font-size: 12px;
        }
        .checklist-table,
        .checklist-table tr,
        .checklist-specs,
        .checklist-specs tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .checklist-actions {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <section class="checklist-page">
      <div class="checklist-actions">
        <button type="button" onclick="window.print()">列印 / 另存 PDF</button>
        <button type="button" onclick="window.close()">關閉</button>
      </div>
      <header class="checklist-head">
        <div>
          <p class="checklist-kicker">Shipping QC</p>
          <h1 class="checklist-title">出機檢查單</h1>
          <p class="checklist-sub">星辰電腦 NSZPC</p>
        </div>
        <div class="checklist-meta">
          <p>檢查單號：${escapeHtml(checklistNumber)}</p>
          <p>建立時間：${escapeHtml(generatedAt)}</p>
          <p>交付狀態：${escapeHtml(statusLabelMap[order.status])}</p>
        </div>
      </header>

      <div class="checklist-grid">
        <article class="checklist-box">
          <h3>出機資訊</h3>
          <p>品項：${escapeHtml(order.item)}</p>
          <p>需求地區：${escapeHtml(order.location)}</p>
          <p>出貨日期：${escapeHtml(order.date)}</p>
        </article>
        <article class="checklist-box">
          <h3>店家資訊</h3>
          <p>地址：${escapeHtml(siteContentForm.contactAddress || '待補充')}</p>
          <p>電話：${escapeHtml(siteContentForm.contactPhone || '待補充')}</p>
          <p>LINE：${escapeHtml(siteContentForm.contactLine || '待補充')}</p>
        </article>
      </div>

      <h3 class="checklist-section-title">本機配置</h3>
      <table class="checklist-specs">
        <colgroup>
          <col style="width: 110px;" />
          <col />
          <col style="width: 110px;" />
          <col />
        </colgroup>
        <tbody>
          ${checklistSpecsRows}
        </tbody>
      </table>

      <h3 class="checklist-section-title">出貨前測試檢測表</h3>
      <table class="checklist-table">
        <tr>
          <th class="section" colspan="6">Windows 系統 (OS)（Windows / Bios）</th>
        </tr>
        <tr>
          <td>系統安裝</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>BIOS 優化</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>零組件相關驅動程式</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>主板驅動安裝</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>顯卡驅動安裝</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>主板(燈光/音效等)</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>水冷螢幕驅動</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>硬碟4K對齊</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td colspan="2"></td>
        </tr>

        <tr>
          <th class="section" colspan="6">測試 OCCT（30M/1H）</th>
        </tr>
        <tr>
          <td>CPU + RAM</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>CPU</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>RAM</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>LINPACK</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>3D ADA</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>VRAM</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>POWER</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td colspan="4" class="fill-cell"><span class="fill-line"></span></td>
        </tr>

        <tr>
          <th class="section" colspan="6">測試 R23（測 CPU）</th>
        </tr>
        <tr>
          <td>Multi Core</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>Single Core</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td colspan="2" class="fill-cell"><span class="fill-line"></span></td>
        </tr>

        <tr>
          <th class="section" colspan="6">測試 AIDA64 + FURMARK（測 CPU / GPU）3H</th>
        </tr>
        <tr>
          <td>CPU 滿載功耗/溫度</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>GPU 滿載功耗/溫度</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td colspan="2" class="fill-cell"><span class="fill-line"></span></td>
        </tr>

        <tr>
          <th class="section" colspan="6">其他測試/配件檢查 AS SSD Benchmark</th>
        </tr>
        <tr>
          <td>待機瓦數</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>滿載瓦數</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>整體穩定性</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>WIFI/藍芽</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>前後音源孔</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>前後USB</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
        <tr>
          <td>燈光同步</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>電源線</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
          <td>WIFI天線</td>
          <td class="center fill-cell"><span class="fill-line"></span></td>
        </tr>
      </table>

      <div class="checklist-footer">
        <div class="checklist-date">出貨日期：${escapeHtml(order.date || '')}</div>
        <div class="checklist-signature">出貨確認簽章：<span class="line"></span></div>
      </div>
    </section>
  </body>
</html>`;

    try {
      checklistWindow.document.open();
      checklistWindow.document.write(checklistHtml);
      checklistWindow.document.close();
      checklistWindow.focus();
      setOrdersSuccess(`已為「${order.item}」產出出機檢查單`);
    } catch {
      checklistWindow.close();
      setOrdersError('出機檢查單產生失敗，請再試一次。');
    }
  };




  const startEditCategory = (category: AdminCategory) => {
    setCategoriesSuccess('');
    setCategoriesError('');
    setEditingCategoryId(category.id);
    setCategoryForm({
      title: category.title,
      summary: category.summary,
      primaryCategory: category.primaryCategory,
      secondaryCategory: category.secondaryCategory,
      tagsText: category.tags.join('\n'),
      pointsText: category.points.join('\n'),
      detailIntro: category.detailIntro || category.summary,
      detailHeroImage: category.detailHeroImage || '',
      detailRecommendationsText: (category.detailRecommendations || []).join('\n'),
      detailFaqsText: serializeCategoryFaqs(category.detailFaqs || []),
    });
    setIsCategoryCreateModalOpen(true);
  };

  const handleDeleteBuild = async (build: AdminBuild) => {
    const confirmed = window.confirm(`確定要刪除推薦配單「${build.name}」嗎？`);
    if (!confirmed) {
      return;
    }

    if (!token) {
      setBuildsError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingBuildId(build.id);
    setBuildsError('');
    setBuildsSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/builds/${build.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除推薦配單失敗'));
      }

      if (editingBuildId === build.id) {
        resetBuildForm();
      }

      setBuildsSuccess('推薦配單已刪除');
      await loadBuilds();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除推薦配單失敗';
      setBuildsError(message);
    } finally {
      setDeletingBuildId(null);
    }
  };

  const handleDeleteOrder = async (order: AdminOrder) => {
    const confirmed = window.confirm(`確定要刪除「${order.item}」嗎？`);
    if (!confirmed) {
      return;
    }

    if (!token) {
      setOrdersError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingOrderId(order.id);
    setOrdersError('');
    setOrdersSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除失敗'));
      }

      if (editingOrderId === order.id) {
        resetOrderForm();
      }

      setOrdersSuccess('出機紀錄已刪除');
      await loadOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除出機紀錄失敗';
      setOrdersError(message);
    } finally {
      setDeletingOrderId(null);
    }
  };





  const handleDeleteCategory = async (category: AdminCategory) => {
    const confirmed = window.confirm(`確定要刪除分類總覽「${category.title}」嗎？`);
    if (!confirmed) {
      return;
    }

    if (!token) {
      setCategoriesError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingCategoryId(category.id);
    setCategoriesError('');
    setCategoriesSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除分類總覽失敗'));
      }

      if (editingCategoryId === category.id) {
        closeCategoryCreateModal();
      }

      setCategoriesSuccess('分類總覽已刪除。');
      await loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除分類總覽失敗';
      setCategoriesError(message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const managedShipmentTagCatalog = parseTagTextValue(siteContentForm.shipmentTagCatalogText);
  const allExistingOrderTags = dedupeCaseInsensitive(orders.flatMap((order) => order.tags || []));
  const orderFormTagList = parseTagTextValue(orderForm.tagsText);
  const selectedOrderTagSet = new Set(orderFormTagList.map((tag) => tag.toLowerCase()));
  const orderTagQuickPickOptions = dedupeCaseInsensitive([
    ...managedShipmentTagCatalog,
    ...orderFormTagList,
  ]);

  const normalizedBuildKeyword = buildSearchKeyword.trim().toLowerCase();
  const filteredBuilds = normalizedBuildKeyword
    ? builds.filter((build) => {
        const fields = [
          build.name,
          build.description,
          build.detailIntro || '',
          build.requirementIntro || '',
          build.youtubeEmbedUrl || '',
          build.dealDate || '',
          build.badge || '',
          build.cpu || '',
          build.ram || '',
          build.storage || '',
          build.gpu || '',
          build.psu || '',
          build.pcCase || '',
          String(build.price),
          ...build.specs,
        ];

        return fields.some((field) => field.toLowerCase().includes(normalizedBuildKeyword));
      })
    : builds;

  const normalizedCategoryKeyword = categorySearchKeyword.trim().toLowerCase();
  const filteredCategories = normalizedCategoryKeyword
    ? categories.filter((category) => {
        const fields = [
          category.title,
          category.summary,
          category.primaryCategory,
          category.secondaryCategory,
          category.detailIntro || '',
          category.detailHeroImage || '',
          ...(category.tags || []),
          ...(category.points || []),
          ...(category.detailRecommendations || []),
          ...(category.detailFaqs || []).flatMap((faq) => [faq.question, faq.answer]),
        ];
        return fields.some((field) => field.toLowerCase().includes(normalizedCategoryKeyword));
      })
    : categories;

  const normalizedOrderKeyword = orderSearchKeyword.trim().toLowerCase();
  const filteredOrders = normalizedOrderKeyword
    ? orders.filter((order) => {
        const fields = [
          order.date,
          order.item,
          order.requirementIntro || '',
          order.youtubeEmbedUrl || '',
          ...(order.tags || []),
          order.location,
          String(order.salePrice),
          order.status,
          statusLabelMap[order.status],
          order.cpu || '',
          order.ram || '',
          order.storage || '',
          order.gpu || '',
          order.psu || '',
          order.pcCase || '',
        ];

        return fields.some((field) => field.toLowerCase().includes(normalizedOrderKeyword));
      })
    : orders;

  const currentDate = new Date();
  const currentMonthLabel = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthOrders = orders.filter((order) => {
    const parsedDate = parseYyyyMmDdDate(order.date);
    if (!parsedDate) {
      return false;
    }

    return (
      parsedDate.getFullYear() === currentDate.getFullYear() &&
      parsedDate.getMonth() === currentDate.getMonth()
    );
  });
  const currentMonthOrderSalesTotal = currentMonthOrders.reduce((sum, order) => sum + order.salePrice, 0);
  const currentMonthOrderPriceDistribution = orderPriceDistributionRanges.map((range) => {
    const count = currentMonthOrders.filter((order) => {
      if (order.salePrice < range.min) {
        return false;
      }

      if (range.max == null) {
        return true;
      }

      return order.salePrice < range.max;
    }).length;

    return {
      ...range,
      count,
    };
  });
  const currentMonthOrderPriceDistributionMax = Math.max(
    ...currentMonthOrderPriceDistribution.map((item) => item.count),
    1,
  );













  const buildTotalPages = Math.max(1, Math.ceil(filteredBuilds.length / BUILD_PAGE_SIZE));
  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORY_PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));

  const safeBuildPage = Math.min(buildPage, buildTotalPages);
  const safeCategoryPage = Math.min(categoryPage, categoryTotalPages);
  const safeOrderPage = Math.min(orderPage, orderTotalPages);

  const pagedBuilds = filteredBuilds.slice(
    (safeBuildPage - 1) * BUILD_PAGE_SIZE,
    safeBuildPage * BUILD_PAGE_SIZE,
  );
  const pagedCategories = filteredCategories.slice(
    (safeCategoryPage - 1) * CATEGORY_PAGE_SIZE,
    safeCategoryPage * CATEGORY_PAGE_SIZE,
  );
  const pagedOrders = filteredOrders.slice(
    (safeOrderPage - 1) * ORDER_PAGE_SIZE,
    safeOrderPage * ORDER_PAGE_SIZE,
  );


  return (
    <AdminShell active={activeAdminTab} onSelect={setActiveAdminTab} email={loginUsername} onLogout={handleLogout}>
      {isLoading ? <p className="admin-note">正在驗證登入狀態...</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}

      {activeAdminTab === 'siteContent' ? (
        <section className="section-card reveal">
          <header className="admin-page-head">
            <div>
              <h1>網站文字</h1>
              <p>首頁標語、各區塊說明、流程、客戶回饋、聯絡方式。改完按最下面的「儲存」，前台馬上更新。</p>
            </div>
          </header>

          <nav className="admin-jump" aria-label="跳到區塊">
            {SITE_CONTENT_SECTIONS.map(([id, label]) => (
              <a key={id} href={`#sc-${id}`} onClick={(event) => {
                event.preventDefault();
                document.getElementById(`sc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                {label}
              </a>
            ))}
          </nav>

          <form className="admin-site-content-form" onSubmit={handleSaveSiteContent}>
            <div className="admin-site-content-grid">
              <div className="admin-content-block" id="sc-home">
                <h3>首頁主視覺</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-home-kicker">
                    首頁主標籤（Kicker）
                    <input
                      id="content-home-kicker"
                      type="text"
                      value={siteContentForm.homeHeroKicker}
                      onChange={(event) => handleSiteContentFieldChange('homeHeroKicker', event.target.value)}
                    />
                  </label>

                  <label className="auth-field admin-field-wide" htmlFor="content-home-title">
                    首頁主標題
                    <input
                      id="content-home-title"
                      type="text"
                      value={siteContentForm.homeHeroTitle}
                      onChange={(event) => handleSiteContentFieldChange('homeHeroTitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field admin-field-wide" htmlFor="content-home-subtitle">
                    首頁主標題描述
                    <textarea
                      id="content-home-subtitle"
                      rows={3}
                      value={siteContentForm.homeHeroSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('homeHeroSubtitle', event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block">
                <h3>首頁各區塊描述</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-home-category-sub">
                    熱門分類描述
                    <input
                      id="content-home-category-sub"
                      type="text"
                      value={siteContentForm.homeCategorySubtitle}
                      onChange={(event) => handleSiteContentFieldChange('homeCategorySubtitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-home-build-sub">
                    推薦配單描述
                    <input
                      id="content-home-build-sub"
                      type="text"
                      value={siteContentForm.homeBuildSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('homeBuildSubtitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-home-workflow-sub">
                    出貨流程描述
                    <input
                      id="content-home-workflow-sub"
                      type="text"
                      value={siteContentForm.homeWorkflowSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('homeWorkflowSubtitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-home-contact-sub">
                    聯絡我們描述
                    <input
                      id="content-home-contact-sub"
                      type="text"
                      value={siteContentForm.homeContactSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('homeContactSubtitle', event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block">
                <h3>首頁統計</h3>
                <div className="admin-multi-input-list">
                  {siteContentForm.homeStats.map((stat, index) => (
                    <div key={`site-stat-${index}`} className="admin-site-array-item">
                      <div className="admin-form-grid">
                        <label className="auth-field" htmlFor={`content-home-stat-value-${index}`}>
                          數值
                          <input
                            id={`content-home-stat-value-${index}`}
                            type="text"
                            value={stat.value}
                            onChange={(event) => handleHomeStatChange(index, 'value', event.target.value)}
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-home-stat-label-${index}`}>
                          標題
                          <input
                            id={`content-home-stat-label-${index}`}
                            type="text"
                            value={stat.label}
                            onChange={(event) => handleHomeStatChange(index, 'label', event.target.value)}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="ghost-btn admin-icon-btn"
                        onClick={() => removeHomeStat(index)}
                      >
                        移除
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ghost-btn admin-add-storage-btn" onClick={addHomeStat}>
                    + 新增統計
                  </button>
                </div>
              </div>

              <div className="admin-content-block" id="sc-categories">
                <h3>分類總覽：主描述與標籤</h3>
                <div className="admin-form-grid">
                  <label className="auth-field admin-field-wide" htmlFor="content-categories-hero-sub">
                    分類頁主描述
                    <textarea
                      id="content-categories-hero-sub"
                      rows={3}
                      value={siteContentForm.categoriesHeroSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('categoriesHeroSubtitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field admin-field-wide" htmlFor="content-categories-tags">
                    熱門需求標籤（每行一個）
                    <textarea
                      id="content-categories-tags"
                      rows={5}
                      value={siteContentForm.categoriesQuickTagsText}
                      onChange={(event) => handleSiteContentFieldChange('categoriesQuickTagsText', event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block">
                <h3>分類總覽：品牌作品集標題</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-categories-portfolio-title">
                    品牌作品集標題
                    <input
                      id="content-categories-portfolio-title"
                      type="text"
                      value={siteContentForm.categoriesPortfolioTitle}
                      onChange={(event) =>
                        handleSiteContentFieldChange('categoriesPortfolioTitle', event.target.value)
                      }
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-categories-portfolio-sub">
                    品牌作品集描述
                    <input
                      id="content-categories-portfolio-sub"
                      type="text"
                      value={siteContentForm.categoriesPortfolioSubtitle}
                      onChange={(event) =>
                        handleSiteContentFieldChange('categoriesPortfolioSubtitle', event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block admin-content-block-full">
                <h3>分類總覽：品牌作品集資料</h3>
                <div className="admin-multi-input-list">
                  {siteContentForm.categoriesBrandPortfolios.map((portfolio, index) => (
                    <div key={`brand-portfolio-${index}`} className="admin-site-array-item">
                      <div className="admin-form-grid">
                        <label className="auth-field" htmlFor={`content-portfolio-id-${index}`}>
                          ID
                          <input
                            id={`content-portfolio-id-${index}`}
                            type="text"
                            value={portfolio.id}
                            onChange={(event) =>
                              handleBrandPortfolioTextFieldChange(index, 'id', event.target.value)
                            }
                          />
                        </label>

                        <label className="auth-field" htmlFor={`content-portfolio-name-${index}`}>
                          名稱
                          <input
                            id={`content-portfolio-name-${index}`}
                            type="text"
                            value={portfolio.name}
                            onChange={(event) =>
                              handleBrandPortfolioTextFieldChange(index, 'name', event.target.value)
                            }
                          />
                        </label>

                        <label className="auth-field admin-field-wide" htmlFor={`content-portfolio-tagline-${index}`}>
                          標語（tagline）
                          <input
                            id={`content-portfolio-tagline-${index}`}
                            type="text"
                            value={portfolio.tagline}
                            onChange={(event) =>
                              handleBrandPortfolioTextFieldChange(index, 'tagline', event.target.value)
                            }
                          />
                        </label>

                        <label className="auth-field admin-field-wide" htmlFor={`content-portfolio-focus-${index}`}>
                          作品重點（以逗號分隔）
                          <input
                            id={`content-portfolio-focus-${index}`}
                            type="text"
                            value={portfolio.focus.join(', ')}
                            onChange={(event) =>
                              handleBrandPortfolioListFieldChange(index, 'focus', event.target.value)
                            }
                          />
                        </label>

                        <label className="auth-field admin-field-wide" htmlFor={`content-portfolio-images-${index}`}>
                          圖片路徑（以逗號分隔）
                          <input
                            id={`content-portfolio-images-${index}`}
                            type="text"
                            value={portfolio.images.join(', ')}
                            onChange={(event) =>
                              handleBrandPortfolioListFieldChange(index, 'images', event.target.value)
                            }
                          />
                        </label>

                        <label className="auth-field admin-field-wide" htmlFor={`content-portfolio-tags-${index}`}>
                          標籤（以逗號分隔）
                          <input
                            id={`content-portfolio-tags-${index}`}
                            type="text"
                            value={portfolio.tags.join(', ')}
                            onChange={(event) =>
                              handleBrandPortfolioListFieldChange(index, 'tags', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        className="ghost-btn admin-icon-btn"
                        onClick={() => removeBrandPortfolio(index)}
                      >
                        移除
                      </button>
                    </div>
                  ))}

                  <button type="button" className="ghost-btn admin-add-storage-btn" onClick={addBrandPortfolio}>
                    + 新增品牌作品集
                  </button>
                </div>
              </div>

              <div className="admin-content-block" id="sc-orders">
                <h3>出機紀錄區塊：標題與描述</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-brand-hero-title">
                    出機紀錄區塊標題
                    <input
                      id="content-brand-hero-title"
                      type="text"
                      value={siteContentForm.brandHeroTitle}
                      onChange={(event) => handleSiteContentFieldChange('brandHeroTitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-brand-hero-subtitle">
                    出機紀錄區塊描述
                    <input
                      id="content-brand-hero-subtitle"
                      type="text"
                      value={siteContentForm.brandHeroSubtitle}
                      onChange={(event) => handleSiteContentFieldChange('brandHeroSubtitle', event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block">
                <h3>出機紀錄：統一標籤庫</h3>
                <div className="admin-form-grid">
                  <label className="auth-field admin-field-wide" htmlFor="content-shipment-tag-catalog">
                    標籤庫（每行一個）
                    <textarea
                      id="content-shipment-tag-catalog"
                      rows={6}
                      placeholder={'例如：\n2K 高刷\n電競\n創作工作站'}
                      value={siteContentForm.shipmentTagCatalogText}
                      onChange={(event) =>
                        handleSiteContentFieldChange('shipmentTagCatalogText', event.target.value)
                      }
                    />
                  </label>
                </div>
                <p className="admin-note">出機紀錄編輯彈窗會優先提供這份標籤供快速勾選。</p>
                <div className="admin-site-tag-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={handleSyncShipmentTagCatalogFromOrders}
                  >
                    從出機紀錄同步標籤
                  </button>
                  <span className="admin-note">目前標籤數：{managedShipmentTagCatalog.length}</span>
                </div>
              </div>

              <div className="admin-content-block" id="sc-process">
                <h3>流程與服務內容</h3>
                <div className="admin-form-grid">
                  <div className="auth-field admin-field-wide">
                    <span>流程細節</span>
                    <div className="admin-multi-input-list">
                      {siteContentForm.shippingSteps.map((step, index) => (
                        <div key={`shipping-step-${index}`} className="admin-site-array-item">
                          <div className="admin-form-grid">
                            <label className="auth-field" htmlFor={`content-brand-step-title-${index}`}>
                              標題
                              <input
                                id={`content-brand-step-title-${index}`}
                                type="text"
                                value={step.title}
                                onChange={(event) =>
                                  handleShippingStepChange(index, 'title', event.target.value)
                                }
                              />
                            </label>
                            <label className="auth-field" htmlFor={`content-brand-step-desc-${index}`}>
                              描述
                              <input
                                id={`content-brand-step-desc-${index}`}
                                type="text"
                                value={step.description}
                                onChange={(event) =>
                                  handleShippingStepChange(index, 'description', event.target.value)
                                }
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            className="ghost-btn admin-icon-btn"
                            onClick={() => removeShippingStep(index)}
                          >
                            移除
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="ghost-btn admin-add-storage-btn"
                        onClick={addShippingStep}
                      >
                        + 新增流程
                      </button>
                    </div>
                  </div>

                  <label className="auth-field admin-field-wide" htmlFor="content-brand-service">
                    服務項目（每行一個）
                    <textarea
                      id="content-brand-service"
                      rows={5}
                      value={siteContentForm.serviceHighlightsText}
                      onChange={(event) => handleSiteContentFieldChange('serviceHighlightsText', event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-content-block" id="sc-testimonials">
                <h3>共用：客戶回饋</h3>
                <div className="admin-multi-input-list">
                  {siteContentForm.testimonials.map((testimonial, index) => (
                    <div key={`testimonial-${index}`} className="admin-site-array-item">
                      <div className="admin-form-grid">
                        <label className="auth-field admin-field-wide" htmlFor={`content-testimonial-quote-${index}`}>
                          回饋內容
                          <textarea
                            id={`content-testimonial-quote-${index}`}
                            rows={3}
                            value={testimonial.quote}
                            onChange={(event) =>
                              handleTestimonialChange(index, 'quote', event.target.value)
                            }
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-testimonial-name-${index}`}>
                          姓名
                          <input
                            id={`content-testimonial-name-${index}`}
                            type="text"
                            value={testimonial.name}
                            onChange={(event) =>
                              handleTestimonialChange(index, 'name', event.target.value)
                            }
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-testimonial-tag-${index}`}>
                          標籤
                          <input
                            id={`content-testimonial-tag-${index}`}
                            type="text"
                            value={testimonial.tag}
                            onChange={(event) =>
                              handleTestimonialChange(index, 'tag', event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="ghost-btn admin-icon-btn"
                        onClick={() => removeTestimonial(index)}
                      >
                        移除
                      </button>
                    </div>
                  ))}

                  <button type="button" className="ghost-btn admin-add-storage-btn" onClick={addTestimonial}>
                    + 新增客戶回饋
                  </button>
                </div>
              </div>

              <div className="admin-content-block" id="sc-contact">
                <h3>共用：聯絡管道</h3>
                <div className="admin-multi-input-list">
                  {siteContentForm.contactChannels.map((channel, index) => (
                    <div key={`contact-channel-${index}`} className="admin-site-array-item">
                      <div className="admin-form-grid">
                        <label className="auth-field" htmlFor={`content-contact-icon-${index}`}>
                          Icon class
                          <input
                            id={`content-contact-icon-${index}`}
                            type="text"
                            value={channel.icon}
                            onChange={(event) =>
                              handleContactChannelChange(index, 'icon', event.target.value)
                            }
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-contact-label-${index}`}>
                          名稱
                          <input
                            id={`content-contact-label-${index}`}
                            type="text"
                            value={channel.label}
                            onChange={(event) =>
                              handleContactChannelChange(index, 'label', event.target.value)
                            }
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-contact-value-${index}`}>
                          顯示文字
                          <input
                            id={`content-contact-value-${index}`}
                            type="text"
                            value={channel.value}
                            onChange={(event) =>
                              handleContactChannelChange(index, 'value', event.target.value)
                            }
                          />
                        </label>
                        <label className="auth-field" htmlFor={`content-contact-href-${index}`}>
                          連結
                          <input
                            id={`content-contact-href-${index}`}
                            type="text"
                            value={channel.href}
                            onChange={(event) =>
                              handleContactChannelChange(index, 'href', event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="ghost-btn admin-icon-btn"
                        onClick={() => removeContactChannel(index)}
                      >
                        移除
                      </button>
                    </div>
                  ))}

                  <button type="button" className="ghost-btn admin-add-storage-btn" onClick={addContactChannel}>
                    + 新增聯絡管道
                  </button>
                </div>
              </div>

              <div className="admin-content-block" id="sc-footer">
                <h3>共用：Footer 與聯絡資訊</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-footer-address">
                    Footer 地址
                    <input
                      id="content-footer-address"
                      type="text"
                      value={siteContentForm.footerAddress}
                      onChange={(event) => handleSiteContentFieldChange('footerAddress', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-footer-slogan">
                    Footer 標語
                    <input
                      id="content-footer-slogan"
                      type="text"
                      value={siteContentForm.footerSlogan}
                      onChange={(event) => handleSiteContentFieldChange('footerSlogan', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-contact-address">
                    聯絡地址
                    <input
                      id="content-contact-address"
                      type="text"
                      value={siteContentForm.contactAddress}
                      onChange={(event) => handleSiteContentFieldChange('contactAddress', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-contact-phone">
                    聯絡電話
                    <input
                      id="content-contact-phone"
                      type="text"
                      value={siteContentForm.contactPhone}
                      onChange={(event) => handleSiteContentFieldChange('contactPhone', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-contact-line">
                    LINE ID
                    <input
                      id="content-contact-line"
                      type="text"
                      value={siteContentForm.contactLine}
                      onChange={(event) => handleSiteContentFieldChange('contactLine', event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {siteContentLoading ? <p className="admin-note">讀取網站內容中...</p> : null}
            {siteContentError ? <p className="auth-error">{siteContentError}</p> : null}
            {siteContentSuccess ? <p className="admin-success">{siteContentSuccess}</p> : null}

            <div className="admin-order-form-actions admin-save-bar">
              <button type="submit" className="solid-btn" disabled={isSavingSiteContent}>
                {isSavingSiteContent ? '儲存中...' : '儲存網站文字'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => loadSiteContent()}
                disabled={siteContentLoading}
              >
                放棄修改
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeAdminTab === 'builds' ? (
        <section className="section-card reveal">
          <header className="admin-page-head">
            <div>
              <h1>推薦配單</h1>
              <p>首頁「推薦配單」區塊的內容，存了前台馬上更新。</p>
            </div>
            <div className="admin-page-actions">
              <button type="button" className="admin-icon-only" onClick={() => loadBuilds()} disabled={buildsLoading} title="重新載入" aria-label="重新載入">
                <i className="fa-solid fa-rotate-right" />
              </button>
              <button type="button" className="solid-btn" onClick={openCreateBuildModal}>
                <i className="fa-solid fa-plus" /> 新增
              </button>
            </div>
          </header>

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="build-search">
              <span className="visually-hidden">搜尋</span>
              <input
                id="build-search"
                type="text"
                placeholder="可搜尋名稱、配備、價格、日期..."
                value={buildSearchKeyword}
                onChange={(event) => setBuildSearchKeyword(event.target.value)}
              />
            </label>
            {buildSearchKeyword ? (
              <button type="button" className="ghost-btn" onClick={() => setBuildSearchKeyword('')}>
                清除查詢
              </button>
            ) : null}
          </div>

          {buildsError ? <p className="auth-error">{buildsError}</p> : null}
          {buildsSuccess ? <p className="admin-success">{buildsSuccess}</p> : null}

          {buildsLoading ? <p className="admin-note">讀取推薦配單中...</p> : null}

          {!buildsLoading && builds.length === 0 ? <p className="admin-note">目前沒有推薦配單資料。</p> : null}
          {!buildsLoading && builds.length > 0 && filteredBuilds.length === 0 ? (
            <p className="admin-note">查無符合條件的推薦配單。</p>
          ) : null}

          <div className="admin-build-list">
            {pagedBuilds.map((build) => (
              <article key={build.id} className="admin-build-item">
                <div className="admin-order-top">
                  <strong>{build.name}</strong>
                  {build.badge ? <span className="admin-build-badge">{build.badge}</span> : null}
                </div>

                <p className="admin-build-description">{build.description}</p>
                <p className="admin-note">介紹內容：{build.detailIntro || build.description}</p>
                <p className="admin-note">
                  需求介紹：
                  {build.requirementIntro || '此配單會先依用途與預算拆解需求，再安排升級路線。'}
                </p>
                <p className="admin-note">
                  YouTube：{build.youtubeEmbedUrl ? '已設定' : '未設定'}
                </p>

                <div className="admin-build-meta">
                  <span>NT$ {build.price.toLocaleString('zh-TW')}</span>
                  <span>成交日期：{build.dealDate || '未標示'}</span>
                  <a className="text-link" href={build.image} target="_blank" rel="noreferrer">
                    查看圖片
                    <i className="fa-solid fa-arrow-right" />
                  </a>
                </div>

                <dl className="admin-build-parts">
                  <dt>CPU</dt>
                  <dd>{build.cpu || '未標示'}</dd>
                  <dt>RAM</dt>
                  <dd>{build.ram || '未標示'}</dd>
                  <dt>硬碟</dt>
                  <dd>{build.storage || '未標示'}</dd>
                  <dt>顯示卡</dt>
                  <dd>{build.gpu || '未標示'}</dd>
                  <dt>電源供應器</dt>
                  <dd>{build.psu || '未標示'}</dd>
                  <dt>機殼</dt>
                  <dd>{build.pcCase || '未標示'}</dd>
                </dl>

                {build.specs.length > 0 ? (
                  <ul className="admin-build-specs">
                    {build.specs.map((spec) => (
                      <li key={`${build.id}-${spec}`}>{spec}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="admin-order-item-actions">
                  <button type="button" className="ghost-btn" onClick={() => startEditBuild(build)}>
                    編輯
                  </button>
                  <button
                    type="button"
                    className="ghost-btn order-delete-btn"
                    onClick={() => handleDeleteBuild(build)}
                    disabled={deletingBuildId === build.id}
                  >
                    {deletingBuildId === build.id ? '刪除中...' : '刪除'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredBuilds.length > BUILD_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setBuildPage(safeBuildPage - 1)}
                disabled={safeBuildPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safeBuildPage} / {buildTotalPages} 頁（共 {filteredBuilds.length} 筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setBuildPage(safeBuildPage + 1)}
                disabled={safeBuildPage >= buildTotalPages}
              >
                下一頁
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeAdminTab === 'categories' ? (
        <section className="section-card reveal">
          <header className="admin-page-head">
            <div>
              <h1>分類總覽</h1>
              <p>會出現在首頁和「分類總覽」頁，每個分類都有自己的介紹頁。</p>
            </div>
            <div className="admin-page-actions">
              <button type="button" className="admin-icon-only" onClick={() => loadCategories()} disabled={categoriesLoading} title="重新載入" aria-label="重新載入">
                <i className="fa-solid fa-rotate-right" />
              </button>
              <button type="button" className="solid-btn" onClick={openCreateCategoryModal}>
                <i className="fa-solid fa-plus" /> 新增
              </button>
            </div>
          </header>

          {categoriesError ? <p className="auth-error">{categoriesError}</p> : null}
          {categoriesSuccess ? <p className="admin-success">{categoriesSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="category-search">
              <span className="visually-hidden">搜尋</span>
              <input
                id="category-search"
                type="text"
                placeholder="可搜尋標題、主分類、次分類、標籤、重點..."
                value={categorySearchKeyword}
                onChange={(event) => setCategorySearchKeyword(event.target.value)}
              />
            </label>
            {categorySearchKeyword ? (
              <button type="button" className="ghost-btn" onClick={() => setCategorySearchKeyword('')}>
                清除查詢
              </button>
            ) : null}
          </div>

          {categoriesLoading ? <p className="admin-note">讀取分類總覽中...</p> : null}

          {!categoriesLoading && categories.length === 0 ? (
            <p className="admin-note">目前沒有分類總覽資料。</p>
          ) : null}
          {!categoriesLoading && categories.length > 0 && filteredCategories.length === 0 ? (
            <p className="admin-note">查無符合條件的分類總覽。</p>
          ) : null}

          <div className="admin-category-list">
            {pagedCategories.map((category) => (
              <article key={category.id} className="admin-category-item">
                <div className="admin-order-top">
                  <strong>{category.title}</strong>
                  <a
                    className="text-link"
                    href={getCategoryDetailPath(category.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看頁面
                    <i className="fa-solid fa-arrow-right" />
                  </a>
                </div>

                <p>{category.summary}</p>
                <p className="admin-note">
                  主分類：{category.primaryCategory} ／ 次分類：{category.secondaryCategory}
                </p>
                <div className="tag-cloud">
                  {category.tags.map((tag) => (
                    <span key={`${category.id}-${tag}`} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="admin-note">需求說明：{category.detailIntro}</p>
                <p className="admin-note">介紹圖片：{category.detailHeroImage}</p>

                <ul className="admin-category-points">
                  {category.points.map((point) => (
                    <li key={`${category.id}-${point}`}>{point}</li>
                  ))}
                </ul>

                <p className="admin-note">
                  建議規劃 {category.detailRecommendations.length} 筆，常見問題 {category.detailFaqs.length} 筆
                </p>

                <div className="admin-order-item-actions">
                  <button type="button" className="ghost-btn" onClick={() => startEditCategory(category)}>
                    編輯
                  </button>
                  <button
                    type="button"
                    className="ghost-btn order-delete-btn"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={deletingCategoryId === category.id}
                  >
                    {deletingCategoryId === category.id ? '刪除中...' : '刪除分類'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredCategories.length > CATEGORY_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setCategoryPage(safeCategoryPage - 1)}
                disabled={safeCategoryPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safeCategoryPage} / {categoryTotalPages} 頁（共 {filteredCategories.length} 筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setCategoryPage(safeCategoryPage + 1)}
                disabled={safeCategoryPage >= categoryTotalPages}
              >
                下一頁
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeAdminTab === 'orders' ? (
        <section className="section-card reveal">
          <header className="admin-page-head">
            <div>
              <h1>出機紀錄</h1>
              <p>官網上的出機案例。通常從內部管理系統的訂單按「發布到官網」帶過來，這裡可以修改文字或手動新增。</p>
            </div>
            <div className="admin-page-actions">
              <button type="button" className="admin-icon-only" onClick={() => loadOrders()} disabled={ordersLoading} title="重新載入" aria-label="重新載入">
                <i className="fa-solid fa-rotate-right" />
              </button>
              <button type="button" className="solid-btn" onClick={openCreateOrderModal}>
                <i className="fa-solid fa-plus" /> 新增
              </button>
            </div>
          </header>

          {ordersError ? <p className="auth-error">{ordersError}</p> : null}
          {ordersSuccess ? <p className="admin-success">{ordersSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="order-search">
              <span className="visually-hidden">搜尋</span>
              <input
                id="order-search"
                type="text"
                placeholder="可搜尋品項、標籤、地區、日期、售價、狀態、CPU、顯示卡..."
                value={orderSearchKeyword}
                onChange={(event) => setOrderSearchKeyword(event.target.value)}
              />
            </label>
            {orderSearchKeyword ? (
              <button type="button" className="ghost-btn" onClick={() => setOrderSearchKeyword('')}>
                清除查詢
              </button>
            ) : null}
          </div>

          {ordersLoading ? <p className="admin-note">讀取出機紀錄中...</p> : null}

          {!ordersLoading && orders.length === 0 ? <p className="admin-note">目前沒有出機紀錄。可以到內部管理系統的訂單按「發布到官網」，或按右上角「新增」。</p> : null}
          {!ordersLoading && orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="admin-note">找不到符合的出機紀錄。</p>
          ) : null}

          {!ordersLoading && orders.length > 0 ? (
            <article className="admin-order-distribution-card">
              <div className="admin-order-distribution-head">
                <h3>{currentMonthLabel} 售價區間分佈</h3>
                <p>
                  本月共 {currentMonthOrders.length} 筆，售價總額 {formatCurrency(currentMonthOrderSalesTotal)}
                </p>
              </div>
              <div className="admin-order-distribution-list">
                {currentMonthOrderPriceDistribution.map((range) => {
                  const ratio = range.count / currentMonthOrderPriceDistributionMax;
                  return (
                    <div key={range.key} className="admin-order-distribution-item">
                      <div className="admin-order-distribution-meta">
                        <span>{range.label}</span>
                        <strong>{range.count} 筆</strong>
                      </div>
                      <div className="admin-order-distribution-track" aria-hidden="true">
                        <span
                          className="admin-order-distribution-fill"
                          style={{ width: `${Math.max(ratio * 100, range.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ) : null}

          {!ordersLoading && filteredOrders.length > 0 ? (
            <div className="admin-order-table-wrap">
              <table className="admin-order-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>地區</th>
                    <th>品項</th>
                    <th>售價</th>
                    <th>狀態</th>
                    <th>核心配備</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.date}</td>
                      <td>{order.location}</td>
                      <td>
                        <div className="admin-order-item-cell">
                          <p>{order.item}</p>
                          {order.tags.length > 0 ? (
                            <div className="tag-cloud admin-order-tag-list">
                              {order.tags.map((tag) => (
                                <span key={`${order.id}-${tag}`} className="tag-pill">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td>{formatCurrency(order.salePrice)}</td>
                      <td>
                        <span className={`order-status-badge ${order.status}`}>{statusLabelMap[order.status]}</span>
                      </td>
                      <td className="admin-order-table-specs">
                        <span>CPU：{order.cpu}</span>
                        <span>RAM：{order.ram}</span>
                        <span>硬碟：{order.storage}</span>
                        <span>顯示卡：{order.gpu}</span>
                        <span>電源供應器：{order.psu}</span>
                        <span>機殼：{order.pcCase}</span>
                      </td>
                      <td>
                        <div className="admin-order-table-actions">
                          <button type="button" className="ghost-btn" onClick={() => startEditOrder(order)}>
                            編輯
                          </button>
                          <a className="admin-icon-only" href={getOrderDetailPath(order.id)} target="_blank" rel="noreferrer" title="在官網上看" aria-label="在官網上看">
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                          </a>
                          <details className="admin-more">
                            <summary className="admin-icon-only" title="更多" aria-label="更多">
                              <i className="fa-solid fa-ellipsis" />
                            </summary>
                            <div className="admin-more-menu">
                              <button type="button" onClick={() => handleGenerateOrderQuotation(order)}>
                                <i className="fa-regular fa-file-lines" /> 產出估價單
                              </button>
                              <button type="button" onClick={() => handleGenerateOrderChecklist(order)}>
                                <i className="fa-regular fa-square-check" /> 產出出機檢查單
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDeleteOrder(order)}
                                disabled={deletingOrderId === order.id}
                              >
                                <i className="fa-regular fa-trash-can" /> {deletingOrderId === order.id ? '刪除中...' : '刪除'}
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {filteredOrders.length > ORDER_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setOrderPage(safeOrderPage - 1)}
                disabled={safeOrderPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safeOrderPage} / {orderTotalPages} 頁（共 {filteredOrders.length} 筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setOrderPage(safeOrderPage + 1)}
                disabled={safeOrderPage >= orderTotalPages}
              >
                下一頁
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {isBuildEditModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetBuildForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-build-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-build-title">{editingBuildId ? '編輯推薦配單' : '新增推薦配單'}</h3>
              <button type="button" className="admin-modal-close" onClick={resetBuildForm}>
                關閉
              </button>
            </div>

            <form className="admin-build-form" onSubmit={handleSaveBuild}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="edit-build-name">
                  配單名稱
                  <input
                    id="edit-build-name"
                    type="text"
                    value={buildForm.name}
                    onChange={(event) => handleBuildFieldChange('name', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-build-price">
                  參考價格
                  <input
                    id="edit-build-price"
                    type="number"
                    min={1}
                    step={1}
                    value={buildForm.priceText}
                    onChange={(event) => handleBuildFieldChange('priceText', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-build-deal-date">
                  成交日期（YYYY/MM/DD）
                  <input
                    id="edit-build-deal-date"
                    type="text"
                    value={buildForm.dealDate}
                    onChange={(event) => handleBuildFieldChange('dealDate', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-description">
                  配單描述
                  <input
                    id="edit-build-description"
                    type="text"
                    value={buildForm.description}
                    onChange={(event) => handleBuildFieldChange('description', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-detail-intro">
                  介紹內容（詳情頁）
                  <textarea
                    id="edit-build-detail-intro"
                    rows={4}
                    placeholder="這台電腦的特色、定位、適用族群"
                    value={buildForm.detailIntro}
                    onChange={(event) => handleBuildFieldChange('detailIntro', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-requirement-intro">
                  需求介紹（詳情頁）
                  <textarea
                    id="edit-build-requirement-intro"
                    rows={3}
                    placeholder="說明這台電腦對應的使用需求與規劃方向"
                    value={buildForm.requirementIntro}
                    onChange={(event) => handleBuildFieldChange('requirementIntro', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-build-image">
                  圖片路徑
                  <input
                    id="edit-build-image"
                    type="text"
                    value={buildForm.image}
                    onChange={(event) => handleBuildFieldChange('image', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-build-badge">
                  標籤（可空白）
                  <input
                    id="edit-build-badge"
                    type="text"
                    value={buildForm.badge}
                    onChange={(event) => handleBuildFieldChange('badge', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-tags">
                  配單標籤（必填，換行或逗號分隔）
                  <textarea
                    id="edit-build-tags"
                    rows={3}
                    placeholder={'例如:\n直播\n剪輯\n白色主題'}
                    value={buildForm.tagsText}
                    onChange={(event) => handleBuildFieldChange('tagsText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-youtube-embed-url">
                  YouTube 連結（可空白，支援 watch/share/embed）
                  <input
                    id="edit-build-youtube-embed-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={buildForm.youtubeEmbedUrl}
                    onChange={(event) => handleBuildFieldChange('youtubeEmbedUrl', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-cpu">
                  CPU
                  <input
                    id="edit-build-cpu"
                    type="text"
                    value={buildForm.cpu}
                    onChange={(event) => handleBuildFieldChange('cpu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-motherboard">
                  主機板
                  <input
                    id="edit-build-motherboard"
                    type="text"
                    value={buildForm.motherboard}
                    onChange={(event) => handleBuildFieldChange('motherboard', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-ram">
                  RAM
                  <input
                    id="edit-build-ram"
                    type="text"
                    value={buildForm.ram}
                    onChange={(event) => handleBuildFieldChange('ram', event.target.value)}
                  />
                </label>

                <div className="auth-field admin-field-wide">
                  <span>硬碟</span>
                  <div className="admin-multi-input-list">
                    {buildStorageFields.map((storage, index) => (
                      <div key={`build-storage-${index}`} className="admin-multi-input-row">
                        <input
                          id={`edit-build-storage-${index}`}
                          type="text"
                          placeholder={index === 0 ? '例如：1TB Gen4 SSD' : `硬碟 ${index + 1}`}
                          value={storage}
                          onChange={(event) => handleBuildStorageFieldChange(index, event.target.value)}
                        />
                        {buildStorageFields.length > 1 ? (
                          <button
                            type="button"
                            className="ghost-btn admin-icon-btn"
                            onClick={() => handleRemoveBuildStorageField(index)}
                            aria-label={`移除第 ${index + 1} 顆硬碟`}
                          >
                            -
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ghost-btn admin-add-storage-btn"
                      onClick={handleAddBuildStorageField}
                    >
                      + 新增硬碟
                    </button>
                  </div>
                </div>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-gpu">
                  顯示卡
                  <input
                    id="edit-build-gpu"
                    type="text"
                    value={buildForm.gpu}
                    onChange={(event) => handleBuildFieldChange('gpu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-psu">
                  電源供應器
                  <input
                    id="edit-build-psu"
                    type="text"
                    value={buildForm.psu}
                    onChange={(event) => handleBuildFieldChange('psu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-case">
                  機殼
                  <input
                    id="edit-build-case"
                    type="text"
                    value={buildForm.pcCase}
                    onChange={(event) => handleBuildFieldChange('pcCase', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-build-accessories">
                  配件（可選填，換行或逗號分隔）
                  <textarea
                    id="edit-build-accessories"
                    rows={3}
                    placeholder={'例如:\nWi-Fi 天線\nARGB 延長線\n原廠風扇升級'}
                    value={buildForm.accessoriesText}
                    onChange={(event) => handleBuildFieldChange('accessoriesText', event.target.value)}
                  />
                </label>

              </div>

              {buildsError ? <p className="auth-error">{buildsError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingBuild}>
                  {isSavingBuild ? '儲存中...' : editingBuildId ? '儲存變更' : '新增推薦配單'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetBuildForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isCategoryCreateModalOpen ? (
        <div className="admin-modal-overlay" onClick={closeCategoryCreateModal}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-category-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="create-category-title">{editingCategoryId ? '編輯分類總覽' : '新增分類總覽'}</h3>
              <button type="button" className="admin-modal-close" onClick={closeCategoryCreateModal}>
                關閉
              </button>
            </div>

            <form className="admin-category-form" onSubmit={handleSaveCategory}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="create-category-title-input">
                  分類標題
                  <input
                    id="create-category-title-input"
                    type="text"
                    placeholder="例如 AI 創作工作站"
                    value={categoryForm.title}
                    onChange={(event) => handleCategoryFieldChange('title', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="create-category-summary">
                  分類簡述
                  <input
                    id="create-category-summary"
                    type="text"
                    placeholder="一句話描述這個分類"
                    value={categoryForm.summary}
                    onChange={(event) => handleCategoryFieldChange('summary', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="create-category-primary">
                  主分類
                  <input
                    id="create-category-primary"
                    type="text"
                    placeholder="例如 創作與直播"
                    value={categoryForm.primaryCategory}
                    onChange={(event) => handleCategoryFieldChange('primaryCategory', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="create-category-secondary">
                  次分類
                  <input
                    id="create-category-secondary"
                    type="text"
                    placeholder="例如 影音輸出"
                    value={categoryForm.secondaryCategory}
                    onChange={(event) => handleCategoryFieldChange('secondaryCategory', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-tags">
                  標籤（換行或逗號分隔）
                  <textarea
                    id="create-category-tags"
                    rows={3}
                    placeholder={'例如:\n直播, 剪輯, 多工, AI 創作'}
                    value={categoryForm.tagsText}
                    onChange={(event) => handleCategoryFieldChange('tagsText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-points">
                  重點條列（換行或逗號分隔）
                  <textarea
                    id="create-category-points"
                    rows={4}
                    placeholder={'例如:\n高效能 AI 運算\n大容量記憶體\n高速儲存配置'}
                    value={categoryForm.pointsText}
                    onChange={(event) => handleCategoryFieldChange('pointsText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-detail-intro">
                  需求說明（前往分類頁主描述）
                  <textarea
                    id="create-category-detail-intro"
                    rows={4}
                    placeholder="說明此分類的適用情境與規劃重點"
                    value={categoryForm.detailIntro}
                    onChange={(event) => handleCategoryFieldChange('detailIntro', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-detail-hero-image">
                  詳情頁主圖路徑
                  <input
                    id="create-category-detail-hero-image"
                    type="text"
                    placeholder="/images/carousel/IMG_6486.JPG"
                    value={categoryForm.detailHeroImage}
                    onChange={(event) => handleCategoryFieldChange('detailHeroImage', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-detail-recommendations">
                  建議規劃（換行或逗號分隔）
                  <textarea
                    id="create-category-detail-recommendations"
                    rows={4}
                    placeholder={'例如:\n先確定主要用途\n再規劃升級路線'}
                    value={categoryForm.detailRecommendationsText}
                    onChange={(event) =>
                      handleCategoryFieldChange('detailRecommendationsText', event.target.value)
                    }
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="create-category-detail-faqs">
                  常見問題（每行：問題 | 回答）
                  <textarea
                    id="create-category-detail-faqs"
                    rows={4}
                    placeholder={'例如:\n適合新手嗎？ | 可以，會先拆解需求再配單'}
                    value={categoryForm.detailFaqsText}
                    onChange={(event) => handleCategoryFieldChange('detailFaqsText', event.target.value)}
                  />
                </label>
              </div>

              {categoriesError ? <p className="auth-error">{categoriesError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingCategory}>
                  {isSavingCategory ? '儲存中...' : editingCategoryId ? '儲存變更' : '新增分類總覽'}
                </button>
                <button type="button" className="ghost-btn" onClick={closeCategoryCreateModal}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isOrderEditModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetOrderForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-order-title">{editingOrderId ? '編輯出機紀錄' : '新增出機紀錄'}</h3>
              <button type="button" className="admin-modal-close" onClick={resetOrderForm}>
                關閉
              </button>
            </div>

            <form className="admin-order-form" onSubmit={handleSaveOrder}>
              <div className="admin-form-grid">
                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-date">
                  出貨日期
                  <input
                    id="edit-shipment-date"
                    type="text"
                    value={orderForm.date}
                    onChange={(event) => handleFieldChange('date', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-location">
                  地區
                  <input
                    id="edit-shipment-location"
                    type="text"
                    value={orderForm.location}
                    onChange={(event) => handleFieldChange('location', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-item">
                  出貨品項
                  <input
                    id="edit-shipment-item"
                    type="text"
                    value={orderForm.item}
                    onChange={(event) => handleFieldChange('item', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-requirement-intro">
                  客戶需求描述（詳情頁）
                  <textarea
                    id="edit-shipment-requirement-intro"
                    rows={4}
                    placeholder="描述這位客戶的需求背景、用途、預算或重點取捨"
                    value={orderForm.requirementIntro}
                    onChange={(event) => handleFieldChange('requirementIntro', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-tags">
                  標籤（可從統一標籤庫點選，或手動輸入）
                  <textarea
                    id="edit-shipment-tags"
                    rows={3}
                    placeholder={'例如：\n2K 高刷\n電競\n直播用途\n（可換行或逗號分隔）'}
                    value={orderForm.tagsText}
                    onChange={(event) => handleFieldChange('tagsText', event.target.value)}
                  />

                  {orderTagQuickPickOptions.length > 0 ? (
                    <div className="tag-cloud admin-order-tag-selector">
                      {orderTagQuickPickOptions.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`tag-pill tag-pill-button ${selectedOrderTagSet.has(tag.toLowerCase()) ? 'active' : ''}`}
                          onClick={() => handleToggleOrderTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-note">尚未設定統一標籤庫，請先到「網站內容管理」新增。</p>
                  )}
                  <div className="admin-order-tag-selector-meta">
                    <span className="admin-note">已選 {orderFormTagList.length} 個標籤</span>
                    {orderFormTagList.length > 0 ? (
                      <button type="button" className="ghost-btn" onClick={() => handleFieldChange('tagsText', '')}>
                        清除已選標籤
                      </button>
                    ) : null}
                  </div>
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-images">
                  出機照片（可空白，換行或逗號分隔）
                  <textarea
                    id="edit-shipment-images"
                    rows={3}
                    placeholder={'例如:\n/images/orders/2026-0212-1.jpg\n/images/orders/2026-0212-2.jpg'}
                    value={orderForm.imagesText}
                    onChange={(event) => handleFieldChange('imagesText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-images-upload">
                  上傳出機照片（支援多張）
                  <input
                    id="edit-shipment-images-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => handleOrderImagesUpload(event.target.files)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-youtube-embed-url">
                  YouTube 連結（可空白，支援 watch/share/embed）
                  <input
                    id="edit-shipment-youtube-embed-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={orderForm.youtubeEmbedUrl}
                    onChange={(event) => handleFieldChange('youtubeEmbedUrl', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-sale-price">
                  售價（NT$）
                  <input
                    id="edit-shipment-sale-price"
                    type="number"
                    min={0}
                    step={1}
                    value={orderForm.salePriceText}
                    onChange={(event) => handleFieldChange('salePriceText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-service-fee">
                  服務費用（NT$）
                  <input
                    id="edit-shipment-service-fee"
                    type="number"
                    min={0}
                    step={1}
                    value={orderForm.serviceFeeText}
                    onChange={(event) => handleFieldChange('serviceFeeText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-status">
                  狀態
                  <select
                    id="edit-shipment-status"
                    value={orderForm.status}
                    onChange={(event) => handleFieldChange('status', event.target.value as OrderStatus)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-cpu">
                  CPU
                  <input
                    id="edit-shipment-cpu"
                    type="text"
                    value={orderForm.cpu}
                    onChange={(event) => handleFieldChange('cpu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-motherboard">
                  主機板
                  <input
                    id="edit-shipment-motherboard"
                    type="text"
                    value={orderForm.motherboard}
                    onChange={(event) => handleFieldChange('motherboard', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-ram">
                  RAM
                  <input
                    id="edit-shipment-ram"
                    type="text"
                    value={orderForm.ram}
                    onChange={(event) => handleFieldChange('ram', event.target.value)}
                  />
                </label>

                <div className="auth-field admin-field-wide">
                  <span>硬碟</span>
                  <div className="admin-multi-input-list">
                    {orderStorageFields.map((storage, index) => (
                      <div key={`shipment-storage-${index}`} className="admin-multi-input-row">
                        <input
                          id={`edit-shipment-storage-${index}`}
                          type="text"
                          placeholder={index === 0 ? '例如：1TB Gen4 SSD' : `硬碟 ${index + 1}`}
                          value={storage}
                          onChange={(event) => handleOrderStorageFieldChange(index, event.target.value)}
                        />
                        {orderStorageFields.length > 1 ? (
                          <button
                            type="button"
                            className="ghost-btn admin-icon-btn"
                            onClick={() => handleRemoveOrderStorageField(index)}
                            aria-label={`移除第 ${index + 1} 顆硬碟`}
                          >
                            -
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ghost-btn admin-add-storage-btn"
                      onClick={handleAddOrderStorageField}
                    >
                      + 新增硬碟
                    </button>
                  </div>
                </div>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-gpu">
                  顯示卡
                  <input
                    id="edit-shipment-gpu"
                    type="text"
                    value={orderForm.gpu}
                    onChange={(event) => handleFieldChange('gpu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-cooler">
                  散熱器
                  <input
                    id="edit-shipment-cooler"
                    type="text"
                    value={orderForm.cooler}
                    onChange={(event) => handleFieldChange('cooler', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-psu">
                  電源供應器
                  <input
                    id="edit-shipment-psu"
                    type="text"
                    value={orderForm.psu}
                    onChange={(event) => handleFieldChange('psu', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-shipment-case">
                  機殼
                  <input
                    id="edit-shipment-case"
                    type="text"
                    value={orderForm.pcCase}
                    onChange={(event) => handleFieldChange('pcCase', event.target.value)}
                  />
                </label>
              </div>

              {ordersError ? <p className="auth-error">{ordersError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingOrder}>
                  {isSavingOrder ? '儲存中...' : editingOrderId ? '儲存變更' : '新增出機紀錄'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetOrderForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
};

export default AdminDashboard;
