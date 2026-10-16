import React from 'react';

import AdminShell from '../components/AdminShell';

import {
  getApiBaseUrl,
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
  createEmptyContactChannel,
  createEmptyShippingStep,
  createEmptySiteStat,
  createEmptyTestimonial,
  dedupeCaseInsensitive,
  defaultBuildForm,
  defaultCategoryForm,
  defaultOrderForm,
  defaultSiteContentForm,
  formatCurrency,
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
  splitLineList,
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
  ['process', '出貨流程'],
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

    setBuildsLoading(true);
    setBuildsError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/builds`);

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
  }, [apiBaseUrl]);

  const loadOrders = React.useCallback(async () => {

    setOrdersLoading(true);
    setOrdersError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders`);

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
  }, [apiBaseUrl]);




  const loadCategories = React.useCallback(async () => {

    setCategoriesLoading(true);
    setCategoriesError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/categories`);

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
  }, [apiBaseUrl]);

  const loadSiteContent = React.useCallback(async () => {

    setSiteContentLoading(true);
    setSiteContentError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/site-content`);

      const payload = (await response.json()) as SiteContentResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取網站內容失敗'));
      }

      const data = (payload as SiteContentResponse).data;
      setSiteContentForm({
        homeHeroTitle: data.homeHeroTitle,
        homeContactSubtitle: data.homeContactSubtitle,
        homeStats: data.homeStats.map((item) => ({
          value: item.value,
          label: item.label,
        })),
        categoriesHeroSubtitle: data.categoriesHeroSubtitle,
        categoriesQuickTagsText: data.categoriesQuickTags.join('\n'),
        brandHeroTitle: data.brandHeroTitle,
        shipmentTagCatalogText: Array.isArray(data.shipmentTagCatalog)
          ? data.shipmentTagCatalog.join('\n')
          : '',
        shippingSteps: data.shippingSteps.map((item) => ({
          title: item.title,
          description: item.description,
        })),
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
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取網站內容失敗';
      setSiteContentError(message);
    } finally {
      setSiteContentLoading(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    const bootstrap = async () => {

      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`);

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
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap().catch(() => {
      setIsLoading(false);
      setError('系統錯誤，請重新登入');
    });
  }, [
    apiBaseUrl,
    loadBuilds,
    loadCategories,
    loadOrders,
    loadSiteContent,
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


    const requiredFields: Array<{ value: string; label: string }> = [
      { value: siteContentForm.homeHeroTitle, label: '首頁主標題' },
      { value: siteContentForm.homeContactSubtitle, label: '首頁聯絡我們描述' },
      { value: siteContentForm.categoriesHeroSubtitle, label: '分類總覽說明' },
      { value: siteContentForm.brandHeroTitle, label: '首頁近期出機標題' },
      { value: siteContentForm.footerAddress, label: 'Footer 地址' },
      { value: siteContentForm.footerSlogan, label: 'Footer 標語' },
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

    const categoriesQuickTags = splitLineList(siteContentForm.categoriesQuickTagsText);
    const shipmentTagCatalog = parseTagTextValue(siteContentForm.shipmentTagCatalogText);

    if (categoriesQuickTags.length === 0) {
      setSiteContentError('分類總覽熱門標籤至少需要一筆');
      return;
    }

    if (shipmentTagCatalog.length === 0) {
      setSiteContentError('出機紀錄標籤庫至少需要一筆');
      return;
    }

    setIsSavingSiteContent(true);
    setSiteContentError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/site-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // 前台已經不顯示的舊欄位（作品集、聯絡電話等）不用送，後端會沿用資料庫裡原本的值
        body: JSON.stringify({
          homeHeroTitle: siteContentForm.homeHeroTitle.trim(),
          homeContactSubtitle: siteContentForm.homeContactSubtitle.trim(),
          homeStats,
          categoriesHeroSubtitle: siteContentForm.categoriesHeroSubtitle.trim(),
          categoriesQuickTags,
          brandHeroTitle: siteContentForm.brandHeroTitle.trim(),
          shipmentTagCatalog,
          shippingSteps,
          testimonials,
          contactChannels,
          footerAddress: siteContentForm.footerAddress.trim(),
          footerSlogan: siteContentForm.footerSlogan.trim(),
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


    setDeletingBuildId(build.id);
    setBuildsError('');
    setBuildsSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/builds/${build.id}`, {
        method: 'DELETE',
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


    setDeletingOrderId(order.id);
    setOrdersError('');
    setOrdersSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${order.id}`, {
        method: 'DELETE',
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


    setDeletingCategoryId(category.id);
    setCategoriesError('');
    setCategoriesSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/categories/${category.id}`, {
        method: 'DELETE',
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
                <h3>首頁</h3>
                <div className="admin-form-grid">
                  <label className="auth-field admin-field-wide" htmlFor="content-home-title">
                    首頁主標題
                    <input
                      id="content-home-title"
                      type="text"
                      value={siteContentForm.homeHeroTitle}
                      onChange={(event) => handleSiteContentFieldChange('homeHeroTitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-brand-hero-title">
                    首頁近期出機標題
                    <input
                      id="content-brand-hero-title"
                      type="text"
                      value={siteContentForm.brandHeroTitle}
                      onChange={(event) => handleSiteContentFieldChange('brandHeroTitle', event.target.value)}
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

              <div className="admin-content-block" id="sc-orders">
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
                <h3>出貨流程</h3>
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
                <h3>共用：Footer</h3>
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
