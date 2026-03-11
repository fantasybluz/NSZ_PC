import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { clearAuth, getApiBaseUrl, getStoredToken, toApiErrorMessage } from '../lib/adminAuth';
import { getCategoryDetailPath } from '../lib/publicCategories';
import { getOrderDetailPath } from '../lib/publicOrders';
import {
  BUILD_PAGE_SIZE,
  CATEGORY_PAGE_SIZE,
  INVENTORY_PAGE_SIZE,
  ORDER_PAGE_SIZE,
  PERSONAL_PROCUREMENT_PAGE_SIZE,
  PROCUREMENT_PAGE_SIZE,
  WEEKLY_PROCUREMENT_PAGE_SIZE,
  adminTabOptions,
  calculateUntaxedPrice,
  createDefaultOrderStorageFields,
  createDefaultPersonalProcurementItems,
  createDefaultProcurementItems,
  createEmptyBrandPortfolio,
  createEmptyContactChannel,
  createEmptyShippingStep,
  createEmptySiteStat,
  createEmptyTestimonial,
  dedupeCaseInsensitive,
  defaultBuildForm,
  defaultCategoryForm,
  defaultInventoryForm,
  defaultOrderForm,
  defaultPersonalProcurementForm,
  defaultProcurementForm,
  defaultSiteContentForm,
  escapeHtml,
  formatCurrency,
  formatSignedCurrency,
  getQuoteNumber,
  inventoryBrandPresets,
  inventoryCategories,
  inventoryCategoryLabels,
  inventoryMotherboardFormFactors,
  isDealDateFormat,
  isSameWeekDate,
  normalizeAdminCategory,
  normalizeAdminInventory,
  normalizeAdminOrder,
  normalizeAdminPersonalProcurement,
  normalizeAdminProcurement,
  normalizeOrderStorageFields,
  orderPriceDistributionRanges,
  parsePipeRows,
  parseTagTextValue,
  parseYyyyMmDdDate,
  procurementSettlementLabels,
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
  type AdminInventory,
  type AdminOrder,
  type AdminPersonalProcurement,
  type AdminProcurement,
  type AdminShippingStep,
  type AdminSiteStat,
  type AdminTabKey,
  type AdminTestimonial,
  type BuildFormState,
  type BuildsResponse,
  type CategoriesResponse,
  type CategoryFormState,
  type InventoriesResponse,
  type InventoryCategory,
  type InventoryFormState,
  type MeResponse,
  type OrderFormState,
  type OrderStatus,
  type OrdersResponse,
  type PersonalProcurementFormState,
  type PersonalProcurementsResponse,
  type ProcurementFormState,
  type ProcurementItemFormState,
  type ProcurementsResponse,
  type SiteContentFormState,
  type SiteContentResponse,
} from './adminDashboard/shared';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const [procurements, setProcurements] = React.useState<AdminProcurement[]>([]);
  const [procurementsLoading, setProcurementsLoading] = React.useState(false);
  const [procurementsError, setProcurementsError] = React.useState('');
  const [procurementsSuccess, setProcurementsSuccess] = React.useState('');
  const [procurementForm, setProcurementForm] = React.useState<ProcurementFormState>(defaultProcurementForm);
  const [procurementItems, setProcurementItems] =
    React.useState<ProcurementItemFormState[]>(createDefaultProcurementItems);
  const [procurementSearchKeyword, setProcurementSearchKeyword] = React.useState('');
  const [procurementMonthFilter, setProcurementMonthFilter] = React.useState('');
  const [procurementPeerFilter, setProcurementPeerFilter] = React.useState('');
  const [procurementSettlementFilter, setProcurementSettlementFilter] = React.useState<
    'all' | 'settled' | 'unsettled'
  >('all');
  const [weeklyUnsettledOnly, setWeeklyUnsettledOnly] = React.useState(false);
  const [weeklyProcurementPage, setWeeklyProcurementPage] = React.useState(1);
  const [procurementPage, setProcurementPage] = React.useState(1);
  const [editingProcurementId, setEditingProcurementId] = React.useState<string | null>(null);
  const [isProcurementEditModalOpen, setIsProcurementEditModalOpen] = React.useState(false);
  const [isSavingProcurement, setIsSavingProcurement] = React.useState(false);
  const [deletingProcurementId, setDeletingProcurementId] = React.useState<string | null>(null);
  const [togglingProcurementId, setTogglingProcurementId] = React.useState<string | null>(null);

  const [personalProcurements, setPersonalProcurements] = React.useState<AdminPersonalProcurement[]>([]);
  const [personalProcurementsLoading, setPersonalProcurementsLoading] = React.useState(false);
  const [personalProcurementsError, setPersonalProcurementsError] = React.useState('');
  const [personalProcurementsSuccess, setPersonalProcurementsSuccess] = React.useState('');
  const [personalProcurementForm, setPersonalProcurementForm] =
    React.useState<PersonalProcurementFormState>(defaultPersonalProcurementForm);
  const [personalProcurementItems, setPersonalProcurementItems] =
    React.useState<ProcurementItemFormState[]>(createDefaultPersonalProcurementItems);
  const [personalProcurementSearchKeyword, setPersonalProcurementSearchKeyword] = React.useState('');
  const [personalProcurementMonthFilter, setPersonalProcurementMonthFilter] = React.useState('');
  const [personalProcurementPage, setPersonalProcurementPage] = React.useState(1);
  const [editingPersonalProcurementId, setEditingPersonalProcurementId] = React.useState<string | null>(null);
  const [isPersonalProcurementEditModalOpen, setIsPersonalProcurementEditModalOpen] = React.useState(false);
  const [isSavingPersonalProcurement, setIsSavingPersonalProcurement] = React.useState(false);
  const [deletingPersonalProcurementId, setDeletingPersonalProcurementId] = React.useState<string | null>(null);

  const [inventories, setInventories] = React.useState<AdminInventory[]>([]);
  const [inventoriesLoading, setInventoriesLoading] = React.useState(false);
  const [inventoriesError, setInventoriesError] = React.useState('');
  const [inventoriesSuccess, setInventoriesSuccess] = React.useState('');
  const [inventoryForm, setInventoryForm] = React.useState<InventoryFormState>(defaultInventoryForm);
  const [inventorySearchKeyword, setInventorySearchKeyword] = React.useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = React.useState<'all' | InventoryCategory>('all');
  const [inventoryBrandFilter, setInventoryBrandFilter] = React.useState('');
  const [inventoryPage, setInventoryPage] = React.useState(1);
  const [editingInventoryId, setEditingInventoryId] = React.useState<string | null>(null);
  const [isInventoryEditModalOpen, setIsInventoryEditModalOpen] = React.useState(false);
  const [isSavingInventory, setIsSavingInventory] = React.useState(false);
  const [deletingInventoryId, setDeletingInventoryId] = React.useState<string | null>(null);

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
  const [activeAdminTab, setActiveAdminTab] = React.useState<AdminTabKey>('siteContent');

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

  const resetProcurementForm = () => {
    setProcurementForm(defaultProcurementForm);
    setProcurementItems(createDefaultProcurementItems(defaultProcurementForm.taxIncluded));
    setEditingProcurementId(null);
    setIsProcurementEditModalOpen(false);
  };

  const resetPersonalProcurementForm = () => {
    setPersonalProcurementForm(defaultPersonalProcurementForm);
    setPersonalProcurementItems(createDefaultPersonalProcurementItems(defaultPersonalProcurementForm.taxIncluded));
    setEditingPersonalProcurementId(null);
    setIsPersonalProcurementEditModalOpen(false);
  };

  const resetInventoryForm = () => {
    setInventoryForm(defaultInventoryForm);
    setEditingInventoryId(null);
    setIsInventoryEditModalOpen(false);
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
        throw new Error(toApiErrorMessage(payload, '讀取訂單管理失敗'));
      }

      const list = (payload as OrdersResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminOrder(item))
            .filter((item): item is AdminOrder => item !== null)
        : [];
      setOrders(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取訂單管理失敗';
      setOrdersError(message);
    } finally {
      setOrdersLoading(false);
    }
  }, [apiBaseUrl, token]);

  const loadProcurements = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setProcurementsLoading(true);
    setProcurementsError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/procurements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ProcurementsResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取同行拿貨紀錄失敗'));
      }

      const list = (payload as ProcurementsResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminProcurement(item))
            .filter((item): item is AdminProcurement => item !== null)
        : [];
      setProcurements(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取同行拿貨紀錄失敗';
      setProcurementsError(message);
    } finally {
      setProcurementsLoading(false);
    }
  }, [apiBaseUrl, token]);

  const loadPersonalProcurements = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setPersonalProcurementsLoading(true);
    setPersonalProcurementsError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/personal-procurements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as PersonalProcurementsResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取公司進貨紀錄失敗'));
      }

      const list = (payload as PersonalProcurementsResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminPersonalProcurement(item))
            .filter((item): item is AdminPersonalProcurement => item !== null)
        : [];
      setPersonalProcurements(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取公司進貨紀錄失敗';
      setPersonalProcurementsError(message);
    } finally {
      setPersonalProcurementsLoading(false);
    }
  }, [apiBaseUrl, token]);

  const loadInventories = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setInventoriesLoading(true);
    setInventoriesError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inventories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as InventoriesResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取庫存失敗'));
      }

      const list = (payload as InventoriesResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeAdminInventory(item))
            .filter((item): item is AdminInventory => item !== null)
        : [];
      setInventories(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取庫存失敗';
      setInventoriesError(message);
    } finally {
      setInventoriesLoading(false);
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
          loadProcurements(),
          loadPersonalProcurements(),
          loadInventories(),
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
    loadInventories,
    loadOrders,
    loadPersonalProcurements,
    loadProcurements,
    loadSiteContent,
    token,
  ]);

  React.useEffect(() => {
    if (
      !isBuildEditModalOpen &&
      !isOrderEditModalOpen &&
      !isProcurementEditModalOpen &&
      !isPersonalProcurementEditModalOpen &&
      !isCategoryCreateModalOpen &&
      !isInventoryEditModalOpen
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

      if (isProcurementEditModalOpen) {
        setProcurementForm(defaultProcurementForm);
        setProcurementItems(createDefaultProcurementItems(defaultProcurementForm.taxIncluded));
        setEditingProcurementId(null);
        setIsProcurementEditModalOpen(false);
      }

      if (isPersonalProcurementEditModalOpen) {
        setPersonalProcurementForm(defaultPersonalProcurementForm);
        setPersonalProcurementItems(
          createDefaultPersonalProcurementItems(defaultPersonalProcurementForm.taxIncluded),
        );
        setEditingPersonalProcurementId(null);
        setIsPersonalProcurementEditModalOpen(false);
      }

      if (isCategoryCreateModalOpen) {
        setCategoryForm(defaultCategoryForm);
        setEditingCategoryId(null);
        setIsCategoryCreateModalOpen(false);
      }

      if (isInventoryEditModalOpen) {
        setInventoryForm(defaultInventoryForm);
        setEditingInventoryId(null);
        setIsInventoryEditModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isBuildEditModalOpen,
    isOrderEditModalOpen,
    isProcurementEditModalOpen,
    isPersonalProcurementEditModalOpen,
    isCategoryCreateModalOpen,
    isInventoryEditModalOpen,
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

  React.useEffect(() => {
    setProcurementPage(1);
  }, [procurementSearchKeyword, procurementMonthFilter, procurementPeerFilter, procurementSettlementFilter]);

  React.useEffect(() => {
    setPersonalProcurementPage(1);
  }, [personalProcurementSearchKeyword, personalProcurementMonthFilter]);

  React.useEffect(() => {
    setWeeklyProcurementPage(1);
  }, [
    procurementSearchKeyword,
    procurementMonthFilter,
    procurementPeerFilter,
    procurementSettlementFilter,
    weeklyUnsettledOnly,
  ]);

  React.useEffect(() => {
    setInventoryPage(1);
  }, [inventorySearchKeyword, inventoryCategoryFilter, inventoryBrandFilter]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login', { replace: true });
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
      setSiteContentError('目前沒有可同步的訂單管理標籤');
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

  const handleProcurementFieldChange = <K extends keyof ProcurementFormState>(
    key: K,
    value: ProcurementFormState[K],
  ) => {
    setProcurementForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePersonalProcurementFieldChange = <K extends keyof PersonalProcurementFormState>(
    key: K,
    value: PersonalProcurementFormState[K],
  ) => {
    setPersonalProcurementForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInventoryFieldChange = <K extends keyof InventoryFormState>(
    key: K,
    value: InventoryFormState[K],
  ) => {
    setInventoryForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'category' && value !== 'motherboard' ? { motherboardFormFactor: '' } : {}),
    }));
  };

  const handleOrderStorageFieldChange = (index: number, value: string) => {
    setOrderStorageFields((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleAddOrderStorageField = () => {
    setOrderStorageFields((prev) => [...prev, '']);
  };

  const handleProcurementItemFieldChange = <K extends keyof ProcurementItemFormState>(
    index: number,
    key: K,
    value: ProcurementItemFormState[K],
  ) => {
    setProcurementItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  };

  const handleAddProcurementItem = () => {
    setProcurementItems((prev) => [...prev, ...createDefaultProcurementItems(procurementForm.taxIncluded)]);
  };

  const handlePersonalProcurementItemFieldChange = <K extends keyof ProcurementItemFormState>(
    index: number,
    key: K,
    value: ProcurementItemFormState[K],
  ) => {
    setPersonalProcurementItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  };

  const handleAddPersonalProcurementItem = () => {
    setPersonalProcurementItems((prev) => [
      ...prev,
      ...createDefaultPersonalProcurementItems(personalProcurementForm.taxIncluded),
    ]);
  };

  const handleRemoveProcurementItem = (index: number) => {
    setProcurementItems((prev) => {
      if (prev.length <= 1) {
        return createDefaultProcurementItems(procurementForm.taxIncluded);
      }

      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : createDefaultProcurementItems(procurementForm.taxIncluded);
    });
  };

  const handleRemovePersonalProcurementItem = (index: number) => {
    setPersonalProcurementItems((prev) => {
      if (prev.length <= 1) {
        return createDefaultPersonalProcurementItems(personalProcurementForm.taxIncluded);
      }

      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : createDefaultPersonalProcurementItems(personalProcurementForm.taxIncluded);
    });
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

  const openCreateProcurementModal = () => {
    setProcurementsError('');
    setProcurementsSuccess('');
    setProcurementForm(defaultProcurementForm);
    setProcurementItems(createDefaultProcurementItems(defaultProcurementForm.taxIncluded));
    setEditingProcurementId(null);
    setIsProcurementEditModalOpen(true);
  };

  const openCreatePersonalProcurementModal = () => {
    setPersonalProcurementsError('');
    setPersonalProcurementsSuccess('');
    setPersonalProcurementForm(defaultPersonalProcurementForm);
    setPersonalProcurementItems(
      createDefaultPersonalProcurementItems(defaultPersonalProcurementForm.taxIncluded),
    );
    setEditingPersonalProcurementId(null);
    setIsPersonalProcurementEditModalOpen(true);
  };

  const openCreateInventoryModal = () => {
    setInventoriesError('');
    setInventoriesSuccess('');
    setInventoryForm(defaultInventoryForm);
    setEditingInventoryId(null);
    setIsInventoryEditModalOpen(true);
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
      { value: siteContentForm.brandHeroTitle, label: '訂單管理區塊標題' },
      { value: siteContentForm.brandHeroSubtitle, label: '訂單管理區塊說明' },
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
      setSiteContentError('訂單管理標籤庫至少需要一筆');
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

      setOrdersSuccess(isEdit ? '訂單管理已更新' : '訂單管理已新增');
      resetOrderForm();
      await loadOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存訂單管理失敗';
      setOrdersError(message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleSaveProcurement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcurementsSuccess('');

    const date = procurementForm.date.trim();
    const peerName = procurementForm.peerName.trim();
    const supplierName = procurementForm.supplierName.trim();
    const source = procurementForm.source.trim();
    const note = procurementForm.note.trim();

    if (!isDealDateFormat(date)) {
      setProcurementsError('日期格式需為 YYYY/MM/DD');
      return;
    }

    if (!peerName || !supplierName || !source) {
      setProcurementsError('請填寫同行名稱、盤商與貨源');
      return;
    }

    const normalizedItems = procurementItems
      .map((item) => {
        const productName = item.productName.trim();
        const quantity = Number(item.quantityText);
        const unitPrice = Number(item.unitPriceText);
        const taxIncluded = item.taxIncluded;

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
        (
          item,
        ): item is {
          productName: string;
          quantity: number;
          unitPrice: number;
          taxIncluded: boolean;
        } => item !== null,
      );

    if (normalizedItems.length === 0) {
      setProcurementsError('請至少新增一筆有效品項（品名、數量、單價）');
      return;
    }

    if (!token) {
      setProcurementsError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingProcurement(true);
    setProcurementsError('');

    try {
      const isEdit = Boolean(editingProcurementId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/procurements/${editingProcurementId}`
        : `${apiBaseUrl}/api/admin/procurements`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          peerName,
          supplierName,
          source,
          taxIncluded: procurementForm.taxIncluded,
          settledThisWeek: procurementForm.settledThisWeek,
          items: normalizedItems,
          note,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新拿貨紀錄失敗' : '新增拿貨紀錄失敗'));
      }

      setProcurementsSuccess(isEdit ? '拿貨紀錄已更新' : '拿貨紀錄已新增');
      resetProcurementForm();
      await loadProcurements();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存拿貨紀錄失敗';
      setProcurementsError(message);
    } finally {
      setIsSavingProcurement(false);
    }
  };

  const handleSavePersonalProcurement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPersonalProcurementsSuccess('');

    const date = personalProcurementForm.date.trim();
    const supplierName = personalProcurementForm.supplierName.trim();
    const source = personalProcurementForm.source.trim();
    const note = personalProcurementForm.note.trim();

    if (!isDealDateFormat(date)) {
      setPersonalProcurementsError('日期格式需為 YYYY/MM/DD');
      return;
    }

    if (!supplierName || !source) {
      setPersonalProcurementsError('請填寫供應商與貨源');
      return;
    }

    const normalizedItems = personalProcurementItems
      .map((item) => {
        const productName = item.productName.trim();
        const quantity = Number(item.quantityText);
        const unitPrice = Number(item.unitPriceText);
        const taxIncluded = item.taxIncluded;

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
        (
          item,
        ): item is {
          productName: string;
          quantity: number;
          unitPrice: number;
          taxIncluded: boolean;
        } => item !== null,
      );

    if (normalizedItems.length === 0) {
      setPersonalProcurementsError('請至少新增一筆有效品項（品名、數量、單價）');
      return;
    }

    if (!token) {
      setPersonalProcurementsError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingPersonalProcurement(true);
    setPersonalProcurementsError('');

    try {
      const isEdit = Boolean(editingPersonalProcurementId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/personal-procurements/${editingPersonalProcurementId}`
        : `${apiBaseUrl}/api/admin/personal-procurements`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          supplierName,
          source,
          taxIncluded: personalProcurementForm.taxIncluded,
          items: normalizedItems,
          note,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新公司進貨紀錄失敗' : '新增公司進貨紀錄失敗'));
      }

      setPersonalProcurementsSuccess(isEdit ? '公司進貨紀錄已更新' : '公司進貨紀錄已新增');
      resetPersonalProcurementForm();
      await loadPersonalProcurements();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存公司進貨紀錄失敗';
      setPersonalProcurementsError(message);
    } finally {
      setIsSavingPersonalProcurement(false);
    }
  };

  const handleSaveInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInventoriesSuccess('');

    const category = inventoryForm.category;
    const brand = inventoryForm.brand.trim();
    const productName = inventoryForm.productName.trim();
    const motherboardFormFactor = inventoryForm.motherboardFormFactor.trim().toUpperCase();
    const quantity = Number(inventoryForm.quantityText);
    const taxIncluded = inventoryForm.taxIncluded;
    const retailPrice = Number(inventoryForm.retailPriceText);
    const costPrice = Number(inventoryForm.costPriceText);
    const note = inventoryForm.note.trim();

    if (!brand || !productName) {
      setInventoriesError('請填寫廠牌與品名');
      return;
    }

    if (category === 'motherboard' && !motherboardFormFactor) {
      setInventoriesError('主機板請填寫尺寸分類（ATX/MATX/ITX）');
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setInventoriesError('庫存數量需為 0 以上整數');
      return;
    }

    if (!Number.isFinite(retailPrice) || retailPrice < 0 || !Number.isFinite(costPrice) || costPrice < 0) {
      setInventoriesError('末端價格與進貨成本需為 0 以上數字');
      return;
    }

    if (costPrice > retailPrice) {
      setInventoriesError('進貨成本不可高於末端價格');
      return;
    }

    if (!token) {
      setInventoriesError('登入狀態已失效，請重新登入');
      return;
    }

    setIsSavingInventory(true);
    setInventoriesError('');

    try {
      const isEdit = Boolean(editingInventoryId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/inventories/${editingInventoryId}`
        : `${apiBaseUrl}/api/admin/inventories`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          brand,
          productName,
          motherboardFormFactor: category === 'motherboard' ? motherboardFormFactor : '',
          quantity,
          taxIncluded,
          retailPrice,
          costPrice,
          note,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新庫存失敗' : '新增庫存失敗'));
      }

      setInventoriesSuccess(isEdit ? '庫存資料已更新' : '庫存資料已新增');
      resetInventoryForm();
      await loadInventories();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存庫存資料失敗';
      setInventoriesError(message);
    } finally {
      setIsSavingInventory(false);
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
        此估價單由後台「訂單管理」資料自動產出，僅供報價與規格確認使用；實際交期與付款方式請以雙方最終確認為準。
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

  const startEditProcurement = (procurement: AdminProcurement) => {
    setProcurementsSuccess('');
    setProcurementsError('');
    setEditingProcurementId(procurement.id);
    setIsProcurementEditModalOpen(true);
    setProcurementForm({
      date: procurement.date,
      peerName: procurement.peerName,
      supplierName: procurement.supplierName,
      source: procurement.source,
      taxIncluded: procurement.taxIncluded,
      settledThisWeek: procurement.settledThisWeek,
      note: procurement.note || '',
    });
    setProcurementItems(
      procurement.items.length > 0
        ? procurement.items.map((item) => ({
            productName: item.productName,
            quantityText: String(item.quantity),
            unitPriceText: String(item.unitPrice),
            taxIncluded: item.taxIncluded,
          }))
        : createDefaultProcurementItems(procurement.taxIncluded),
    );
  };

  const startEditPersonalProcurement = (procurement: AdminPersonalProcurement) => {
    setPersonalProcurementsSuccess('');
    setPersonalProcurementsError('');
    setEditingPersonalProcurementId(procurement.id);
    setIsPersonalProcurementEditModalOpen(true);
    setPersonalProcurementForm({
      date: procurement.date,
      supplierName: procurement.supplierName,
      source: procurement.source,
      taxIncluded: procurement.taxIncluded,
      note: procurement.note || '',
    });
    setPersonalProcurementItems(
      procurement.items.length > 0
        ? procurement.items.map((item) => ({
            productName: item.productName,
            quantityText: String(item.quantity),
            unitPriceText: String(item.unitPrice),
            taxIncluded: item.taxIncluded,
          }))
        : createDefaultPersonalProcurementItems(procurement.taxIncluded),
    );
  };

  const startEditInventory = (inventory: AdminInventory) => {
    setInventoriesSuccess('');
    setInventoriesError('');
    setEditingInventoryId(inventory.id);
    setIsInventoryEditModalOpen(true);
    setInventoryForm({
      category: inventory.category,
      brand: inventory.brand,
      productName: inventory.productName,
      motherboardFormFactor: inventory.motherboardFormFactor || '',
      quantityText: String(inventory.quantity),
      taxIncluded: inventory.taxIncluded,
      retailPriceText: String(inventory.retailPrice),
      costPriceText: String(inventory.costPrice),
      note: inventory.note || '',
    });
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

      setOrdersSuccess('訂單管理已刪除');
      await loadOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除訂單管理失敗';
      setOrdersError(message);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleDeleteProcurement = async (procurement: AdminProcurement) => {
    const confirmed = window.confirm(
      `確定要刪除「${procurement.date}｜${procurement.peerName}｜${procurement.supplierName}」嗎？`,
    );
    if (!confirmed) {
      return;
    }

    if (!token) {
      setProcurementsError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingProcurementId(procurement.id);
    setProcurementsError('');
    setProcurementsSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/procurements/${procurement.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除拿貨紀錄失敗'));
      }

      if (editingProcurementId === procurement.id) {
        resetProcurementForm();
      }

      setProcurementsSuccess('拿貨紀錄已刪除');
      await loadProcurements();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除拿貨紀錄失敗';
      setProcurementsError(message);
    } finally {
      setDeletingProcurementId(null);
    }
  };

  const handleDeletePersonalProcurement = async (procurement: AdminPersonalProcurement) => {
    const confirmed = window.confirm(
      `確定要刪除「${procurement.date}｜${procurement.supplierName}｜${procurement.source}」嗎？`,
    );
    if (!confirmed) {
      return;
    }

    if (!token) {
      setPersonalProcurementsError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingPersonalProcurementId(procurement.id);
    setPersonalProcurementsError('');
    setPersonalProcurementsSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/personal-procurements/${procurement.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除公司進貨紀錄失敗'));
      }

      if (editingPersonalProcurementId === procurement.id) {
        resetPersonalProcurementForm();
      }

      setPersonalProcurementsSuccess('公司進貨紀錄已刪除');
      await loadPersonalProcurements();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除公司進貨紀錄失敗';
      setPersonalProcurementsError(message);
    } finally {
      setDeletingPersonalProcurementId(null);
    }
  };

  const handleToggleProcurementSettled = async (procurement: AdminProcurement) => {
    if (!token) {
      setProcurementsError('登入狀態已失效，請重新登入');
      return;
    }

    setTogglingProcurementId(procurement.id);
    setProcurementsError('');
    setProcurementsSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/procurements/${procurement.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: procurement.date,
          peerName: procurement.peerName,
          supplierName: procurement.supplierName,
          source: procurement.source,
          taxIncluded: procurement.taxIncluded,
          settledThisWeek: !procurement.settledThisWeek,
          items: procurement.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxIncluded: item.taxIncluded,
          })),
          note: procurement.note || '',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '更新結清狀態失敗'));
      }

      setProcurementsSuccess(
        `${procurement.peerName} 已更新為${
          procurement.settledThisWeek ? procurementSettlementLabels.unsettled : procurementSettlementLabels.settled
        }`,
      );
      await loadProcurements();
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新結清狀態失敗';
      setProcurementsError(message);
    } finally {
      setTogglingProcurementId(null);
    }
  };

  const handleDeleteInventory = async (inventory: AdminInventory) => {
    const confirmed = window.confirm(`確定要刪除庫存「${inventory.brand} ${inventory.productName}」嗎？`);
    if (!confirmed) {
      return;
    }

    if (!token) {
      setInventoriesError('登入狀態已失效，請重新登入');
      return;
    }

    setDeletingInventoryId(inventory.id);
    setInventoriesError('');
    setInventoriesSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inventories/${inventory.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除庫存失敗'));
      }

      if (editingInventoryId === inventory.id) {
        resetInventoryForm();
      }

      setInventoriesSuccess('庫存資料已刪除');
      await loadInventories();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除庫存資料失敗';
      setInventoriesError(message);
    } finally {
      setDeletingInventoryId(null);
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

  const normalizedProcurementKeyword = procurementSearchKeyword.trim().toLowerCase();
  const normalizedProcurementMonth = procurementMonthFilter.trim();
  const normalizedProcurementPeerFilter = procurementPeerFilter.trim().toLowerCase();
  const filteredProcurements = procurements.filter((procurement) => {
    const parsedDate = parseYyyyMmDdDate(procurement.date);
    if (normalizedProcurementMonth) {
      if (!parsedDate) {
        return false;
      }

      const procurementMonth = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
      if (procurementMonth !== normalizedProcurementMonth) {
        return false;
      }
    }

    if (procurementSettlementFilter === 'settled' && !procurement.settledThisWeek) {
      return false;
    }

    if (procurementSettlementFilter === 'unsettled' && procurement.settledThisWeek) {
      return false;
    }

    if (normalizedProcurementPeerFilter && procurement.peerName.toLowerCase() !== normalizedProcurementPeerFilter) {
      return false;
    }

    if (!normalizedProcurementKeyword) {
      return true;
    }

    const itemFields = procurement.items.flatMap((item) => [
      item.productName,
      String(item.quantity),
      String(item.unitPrice),
      String(calculateUntaxedPrice(item.unitPrice, item.taxIncluded)),
      item.taxIncluded ? '含稅' : '未稅',
    ]);

    const fields = [
      procurement.date,
      procurement.peerName,
      procurement.supplierName,
      procurement.source,
      procurement.settledThisWeek ? procurementSettlementLabels.settled : procurementSettlementLabels.unsettled,
      procurement.note || '',
      ...itemFields,
    ];

    return fields.some((field) => field.toLowerCase().includes(normalizedProcurementKeyword));
  });

  const procurementPeerOptions = [...new Set(procurements.map((item) => item.peerName).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  const procurementRows = filteredProcurements.map((procurement) => {
    const totalAmount = procurement.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const untaxedTotal = procurement.items.reduce((sum, item) => {
      return sum + item.quantity * calculateUntaxedPrice(item.unitPrice, item.taxIncluded);
    }, 0);
    const parsedDate = parseYyyyMmDdDate(procurement.date);
    const dateKey = parsedDate
      ? `${parsedDate.getFullYear()}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${String(
          parsedDate.getDate(),
        ).padStart(2, '0')}`
      : procurement.date;

    return {
      procurement,
      totalAmount,
      untaxedTotal,
      parsedDate,
      dateKey,
    };
  });

  const procurementTotals = procurementRows.reduce(
    (acc, row) => {
      acc.totalAmount += row.totalAmount;
      acc.untaxedTotal += row.untaxedTotal;
      acc.itemCount += row.procurement.items.length;
      acc.taxIncludedItemCount += row.procurement.items.filter((item) => item.taxIncluded).length;
      if (row.procurement.settledThisWeek) {
        acc.settledCount += 1;
        acc.settledAmount += row.totalAmount;
      } else {
        acc.unsettledCount += 1;
        acc.unsettledAmount += row.totalAmount;
      }
      return acc;
    },
    {
      totalAmount: 0,
      untaxedTotal: 0,
      itemCount: 0,
      taxIncludedItemCount: 0,
      settledCount: 0,
      unsettledCount: 0,
      settledAmount: 0,
      unsettledAmount: 0,
    },
  );

  const procurementUniquePeerCount = new Set(procurementRows.map((row) => row.procurement.peerName)).size;
  const procurementTaxIncludedRatio =
    procurementTotals.itemCount > 0 ? procurementTotals.taxIncludedItemCount / procurementTotals.itemCount : 0;
  const procurementSettlementAmountRatio =
    procurementTotals.totalAmount > 0 ? procurementTotals.settledAmount / procurementTotals.totalAmount : 0;

  const weeklyProcurementRows = procurementRows.filter(
    (row) => row.parsedDate != null && isSameWeekDate(row.parsedDate, currentDate),
  );
  const weeklyProcurementList = [...weeklyProcurementRows].sort((a, b) => {
    const left = a.parsedDate ? a.parsedDate.getTime() : 0;
    const right = b.parsedDate ? b.parsedDate.getTime() : 0;
    if (left !== right) {
      return right - left;
    }
    return a.procurement.peerName.localeCompare(b.procurement.peerName);
  });
  const currentWeekTotalAmount = weeklyProcurementRows.reduce((sum, row) => sum + row.totalAmount, 0);
  const currentWeekUnsettledAmount = weeklyProcurementRows
    .filter((row) => !row.procurement.settledThisWeek)
    .reduce((sum, row) => sum + row.totalAmount, 0);
  const weeklyProcurementDisplayList = weeklyUnsettledOnly
    ? weeklyProcurementList.filter((row) => !row.procurement.settledThisWeek)
    : weeklyProcurementList;
  const currentWeekDisplayAmount = weeklyProcurementDisplayList.reduce((sum, row) => sum + row.totalAmount, 0);
  const weeklyUnsettledPeerSummaryMap = weeklyProcurementRows.reduce(
    (acc, row) => {
      if (row.procurement.settledThisWeek) {
        return acc;
      }

      const peerName = row.procurement.peerName.trim() || '未命名同行';
      let peerSummary = acc.get(peerName);
      if (!peerSummary) {
        peerSummary = {
          peerName,
          recordCount: 0,
          totalAmount: 0,
          untaxedTotal: 0,
          suppliers: new Set<string>(),
          sources: new Set<string>(),
          items: new Map<
            string,
            {
              productName: string;
              taxIncluded: boolean;
              quantity: number;
              totalAmount: number;
              untaxedTotal: number;
            }
          >(),
        };
        acc.set(peerName, peerSummary);
      }

      peerSummary.recordCount += 1;
      peerSummary.totalAmount += row.totalAmount;
      peerSummary.untaxedTotal += row.untaxedTotal;
      peerSummary.suppliers.add(row.procurement.supplierName.trim() || '未填寫');
      peerSummary.sources.add(row.procurement.source.trim() || '未填寫');

      row.procurement.items.forEach((item) => {
        const productName = item.productName.trim() || '未命名品項';
        const itemKey = `${productName.toLowerCase()}::${item.taxIncluded ? 'included' : 'excluded'}`;
        const itemAmount = item.quantity * item.unitPrice;
        const itemUntaxedAmount = item.quantity * calculateUntaxedPrice(item.unitPrice, item.taxIncluded);
        const existingItem = peerSummary.items.get(itemKey);

        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.totalAmount += itemAmount;
          existingItem.untaxedTotal += itemUntaxedAmount;
          return;
        }

        peerSummary.items.set(itemKey, {
          productName,
          taxIncluded: item.taxIncluded,
          quantity: item.quantity,
          totalAmount: itemAmount,
          untaxedTotal: itemUntaxedAmount,
        });
      });

      return acc;
    },
    new Map<
      string,
      {
        peerName: string;
        recordCount: number;
        totalAmount: number;
        untaxedTotal: number;
        suppliers: Set<string>;
        sources: Set<string>;
        items: Map<
          string,
          {
            productName: string;
            taxIncluded: boolean;
            quantity: number;
            totalAmount: number;
            untaxedTotal: number;
          }
        >;
      }
    >(),
  );
  const weeklyUnsettledPeerSummaries = [...weeklyUnsettledPeerSummaryMap.values()]
    .map((peerSummary) => ({
      peerName: peerSummary.peerName,
      recordCount: peerSummary.recordCount,
      totalAmount: peerSummary.totalAmount,
      untaxedTotal: peerSummary.untaxedTotal,
      suppliers: [...peerSummary.suppliers],
      sources: [...peerSummary.sources],
      items: [...peerSummary.items.values()].sort((a, b) => b.totalAmount - a.totalAmount),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const dailyAmountMap = procurementRows.reduce((acc, row) => {
    acc.set(row.dateKey, (acc.get(row.dateKey) || 0) + row.totalAmount);
    return acc;
  }, new Map<string, number>());
  const procurementDailySeries = [...dailyAmountMap.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);
  const procurementDailyMaxAmount = Math.max(...procurementDailySeries.map((item) => item.amount), 1);

  const peerAmountMap = procurementRows.reduce((acc, row) => {
    const peerName = row.procurement.peerName;
    acc.set(peerName, (acc.get(peerName) || 0) + row.totalAmount);
    return acc;
  }, new Map<string, number>());
  const procurementPeerSeries = [...peerAmountMap.entries()]
    .map(([peerName, amount]) => ({ peerName, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
  const procurementPeerMaxAmount = Math.max(...procurementPeerSeries.map((item) => item.amount), 1);

  const buildPersonalProcurementRow = (procurement: AdminPersonalProcurement) => {
    const totalAmount = procurement.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const untaxedTotal = procurement.items.reduce((sum, item) => {
      return sum + item.quantity * calculateUntaxedPrice(item.unitPrice, item.taxIncluded);
    }, 0);
    const parsedDate = parseYyyyMmDdDate(procurement.date);
    const dateKey = parsedDate
      ? `${parsedDate.getFullYear()}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${String(
          parsedDate.getDate(),
        ).padStart(2, '0')}`
      : procurement.date;

    return {
      procurement,
      totalAmount,
      untaxedTotal,
      parsedDate,
      dateKey,
    };
  };

  const normalizedPersonalProcurementKeyword = personalProcurementSearchKeyword.trim().toLowerCase();
  const normalizedPersonalProcurementMonth = personalProcurementMonthFilter.trim();
  const defaultPersonalProcurementMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const effectivePersonalProcurementMonth = normalizedPersonalProcurementMonth || defaultPersonalProcurementMonth;
  const personalProcurementMonthMatch = effectivePersonalProcurementMonth.match(/^(\d{4})-(\d{2})$/);
  const personalProcurementSummaryYear = personalProcurementMonthMatch
    ? Number(personalProcurementMonthMatch[1])
    : currentDate.getFullYear();
  const personalProcurementSummaryMonth = personalProcurementMonthMatch
    ? Number(personalProcurementMonthMatch[2])
    : currentDate.getMonth() + 1;
  const personalProcurementSummaryLabel = `${personalProcurementSummaryYear}/${String(
    personalProcurementSummaryMonth,
  ).padStart(2, '0')}`;
  const filteredPersonalProcurements = personalProcurements.filter((procurement) => {
    const parsedDate = parseYyyyMmDdDate(procurement.date);
    if (normalizedPersonalProcurementMonth) {
      if (!parsedDate) {
        return false;
      }

      const procurementMonth = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
      if (procurementMonth !== normalizedPersonalProcurementMonth) {
        return false;
      }
    }

    if (!normalizedPersonalProcurementKeyword) {
      return true;
    }

    const itemFields = procurement.items.flatMap((item) => [
      item.productName,
      String(item.quantity),
      String(item.unitPrice),
      String(calculateUntaxedPrice(item.unitPrice, item.taxIncluded)),
      item.taxIncluded ? '含稅' : '未稅',
    ]);

    const fields = [
      procurement.date,
      procurement.supplierName,
      procurement.source,
      procurement.note || '',
      ...itemFields,
    ];

    return fields.some((field) => field.toLowerCase().includes(normalizedPersonalProcurementKeyword));
  });
  const allPersonalProcurementRows = personalProcurements.map((procurement) => buildPersonalProcurementRow(procurement));
  const currentMonthPersonalProcurementRows = allPersonalProcurementRows.filter(
    (row) =>
      row.parsedDate != null &&
      row.parsedDate.getFullYear() === personalProcurementSummaryYear &&
      row.parsedDate.getMonth() === personalProcurementSummaryMonth - 1,
  );
  const currentMonthPersonalProcurementTotals = currentMonthPersonalProcurementRows.reduce(
    (acc, row) => {
      acc.recordCount += 1;
      acc.totalAmount += row.totalAmount;
      acc.untaxedTotal += row.untaxedTotal;
      acc.itemCount += row.procurement.items.length;
      row.procurement.items.forEach((item) => {
        acc.quantity += item.quantity;
      });
      acc.suppliers.add(row.procurement.supplierName.trim() || '未填寫');
      return acc;
    },
    {
      recordCount: 0,
      totalAmount: 0,
      untaxedTotal: 0,
      itemCount: 0,
      quantity: 0,
      suppliers: new Set<string>(),
    },
  );
  const currentMonthPersonalSupplierSeries = [...currentMonthPersonalProcurementRows]
    .reduce((acc, row) => {
      const supplierName = row.procurement.supplierName.trim() || '未填寫';
      acc.set(supplierName, (acc.get(supplierName) || 0) + row.totalAmount);
      return acc;
    }, new Map<string, number>())
    .entries();
  const sortedCurrentMonthPersonalSupplierSeries = [...currentMonthPersonalSupplierSeries]
    .map(([supplierName, amount]) => ({ supplierName, amount }))
    .sort((a, b) => b.amount - a.amount);

  const normalizedInventoryKeyword = inventorySearchKeyword.trim().toLowerCase();
  const normalizedInventoryBrandFilter = inventoryBrandFilter.trim().toLowerCase();
  const filteredInventories = inventories.filter((inventory) => {
    if (inventoryCategoryFilter !== 'all' && inventory.category !== inventoryCategoryFilter) {
      return false;
    }

    if (normalizedInventoryBrandFilter && inventory.brand.toLowerCase() !== normalizedInventoryBrandFilter) {
      return false;
    }

    if (!normalizedInventoryKeyword) {
      return true;
    }

    const fields = [
      inventoryCategoryLabels[inventory.category],
      inventory.category,
      inventory.brand,
      inventory.productName,
      inventory.motherboardFormFactor || '',
      inventory.taxIncluded ? '含稅' : '未稅',
      inventory.note || '',
      String(inventory.quantity),
      String(inventory.retailPrice),
      String(inventory.costPrice),
    ];

    return fields.some((field) => field.toLowerCase().includes(normalizedInventoryKeyword));
  });

  const inventoryBrandOptions = [
    ...new Set(
      [
        ...(
          inventoryCategoryFilter === 'all'
            ? Object.values(inventoryBrandPresets).flat()
            : inventoryBrandPresets[inventoryCategoryFilter]
        ),
        ...inventories
          .filter((inventory) => inventoryCategoryFilter === 'all' || inventory.category === inventoryCategoryFilter)
          .map((inventory) => inventory.brand),
      ].filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const showInventoryMotherboardColumn = inventoryCategoryFilter === 'motherboard';
  const inventoryCategoryAmountMap = filteredInventories.reduce((acc, inventory) => {
    const category = inventory.category;
    const untaxedRetailPrice = calculateUntaxedPrice(inventory.retailPrice, inventory.taxIncluded);
    const untaxedCostPrice = calculateUntaxedPrice(inventory.costPrice, inventory.taxIncluded);
    const retailAmount = untaxedRetailPrice * inventory.quantity;
    const costAmount = untaxedCostPrice * inventory.quantity;
    const current = acc.get(category) || {
      category,
      retailAmount: 0,
      costAmount: 0,
      quantity: 0,
      itemCount: 0,
    };

    current.retailAmount += retailAmount;
    current.costAmount += costAmount;
    current.quantity += inventory.quantity;
    current.itemCount += 1;
    acc.set(category, current);
    return acc;
  }, new Map<
    InventoryCategory,
    {
      category: InventoryCategory;
      retailAmount: number;
      costAmount: number;
      quantity: number;
      itemCount: number;
    }
  >());
  const inventoryCategoryAmountSeries = inventoryCategories
    .map((category) => inventoryCategoryAmountMap.get(category) || null)
    .filter(
      (
        item,
      ): item is {
        category: InventoryCategory;
        retailAmount: number;
        costAmount: number;
        quantity: number;
        itemCount: number;
      } => item !== null,
    )
    .sort((a, b) => b.retailAmount - a.retailAmount);
  const inventoryCategoryAmountMax = Math.max(...inventoryCategoryAmountSeries.map((item) => item.retailAmount), 1);
  const inventoryCategoryRetailTotal = inventoryCategoryAmountSeries.reduce((sum, item) => sum + item.retailAmount, 0);
  const inventoryCategoryCostTotal = inventoryCategoryAmountSeries.reduce((sum, item) => sum + item.costAmount, 0);

  const buildTotalPages = Math.max(1, Math.ceil(filteredBuilds.length / BUILD_PAGE_SIZE));
  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORY_PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));
  const procurementTotalPages = Math.max(1, Math.ceil(filteredProcurements.length / PROCUREMENT_PAGE_SIZE));
  const personalProcurementTotalPages = Math.max(
    1,
    Math.ceil(filteredPersonalProcurements.length / PERSONAL_PROCUREMENT_PAGE_SIZE),
  );
  const inventoryTotalPages = Math.max(1, Math.ceil(filteredInventories.length / INVENTORY_PAGE_SIZE));
  const weeklyProcurementTotalPages = Math.max(
    1,
    Math.ceil(weeklyProcurementDisplayList.length / WEEKLY_PROCUREMENT_PAGE_SIZE),
  );

  const safeBuildPage = Math.min(buildPage, buildTotalPages);
  const safeCategoryPage = Math.min(categoryPage, categoryTotalPages);
  const safeOrderPage = Math.min(orderPage, orderTotalPages);
  const safeProcurementPage = Math.min(procurementPage, procurementTotalPages);
  const safePersonalProcurementPage = Math.min(personalProcurementPage, personalProcurementTotalPages);
  const safeInventoryPage = Math.min(inventoryPage, inventoryTotalPages);
  const safeWeeklyProcurementPage = Math.min(weeklyProcurementPage, weeklyProcurementTotalPages);

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
  const pagedProcurements = filteredProcurements.slice(
    (safeProcurementPage - 1) * PROCUREMENT_PAGE_SIZE,
    safeProcurementPage * PROCUREMENT_PAGE_SIZE,
  );
  const pagedPersonalProcurements = filteredPersonalProcurements.slice(
    (safePersonalProcurementPage - 1) * PERSONAL_PROCUREMENT_PAGE_SIZE,
    safePersonalProcurementPage * PERSONAL_PROCUREMENT_PAGE_SIZE,
  );
  const pagedInventories = filteredInventories.slice(
    (safeInventoryPage - 1) * INVENTORY_PAGE_SIZE,
    safeInventoryPage * INVENTORY_PAGE_SIZE,
  );
  const pagedWeeklyProcurementDisplayList = weeklyProcurementDisplayList.slice(
    (safeWeeklyProcurementPage - 1) * WEEKLY_PROCUREMENT_PAGE_SIZE,
    safeWeeklyProcurementPage * WEEKLY_PROCUREMENT_PAGE_SIZE,
  );

  const handleDownloadPersonalMonthlyReport = () => {
    if (currentMonthPersonalProcurementRows.length === 0) {
      setPersonalProcurementsError(
        normalizedPersonalProcurementMonth
          ? `${personalProcurementSummaryLabel} 尚無可匯出的公司進貨紀錄`
          : '本月尚無可匯出的公司進貨紀錄',
      );
      return;
    }

    const orderedRows = [...currentMonthPersonalProcurementRows].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    const lines: string[] = [
      `報表月份,${personalProcurementSummaryLabel}`,
      `本月進貨筆數,${currentMonthPersonalProcurementTotals.recordCount}`,
      `本月品項數,${currentMonthPersonalProcurementTotals.itemCount}`,
      `本月總數量,${currentMonthPersonalProcurementTotals.quantity}`,
      `本月總額,${currentMonthPersonalProcurementTotals.totalAmount}`,
      `本月未稅總額,${currentMonthPersonalProcurementTotals.untaxedTotal}`,
      '',
      '日期,供應商,貨源,品名,數量,稅別,單價,未稅單價,小計,備註',
    ];

    orderedRows.forEach((row) => {
      row.procurement.items.forEach((item) => {
        const values = [
          row.procurement.date,
          row.procurement.supplierName,
          row.procurement.source,
          item.productName,
          String(item.quantity),
          item.taxIncluded ? '含稅' : '未稅',
          String(item.unitPrice),
          String(calculateUntaxedPrice(item.unitPrice, item.taxIncluded)),
          String(item.quantity * item.unitPrice),
          row.procurement.note || '',
        ];
        lines.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
      });
    });

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `company-procurement-${personalProcurementSummaryLabel.replace('/', '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setPersonalProcurementsSuccess(`已下載 ${personalProcurementSummaryLabel} 公司進貨報表`);
  };

  return (
    <div className="page admin-page">
      <section className="section-card reveal">
        <p className="section-kicker">Admin Console</p>
        <h1 className="section-title">後台控制台</h1>
        <p className="section-sub">管理網站內容、推薦配單、分類總覽、出貨、拿貨與庫存，並檢查 API 文件。</p>
      
        {!isLoading && loginUsername ? <p className="admin-note">Hi，{loginUsername}</p> : null}

        {isLoading ? <p className="admin-note">正在驗證登入狀態...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <div className="admin-actions">
          <a
            className="solid-btn"
            href={`${apiBaseUrl}/api-docs`}
            target="_blank"
            rel="noreferrer"
          >
            開啟 Swagger
          </a>
          <a className="ghost-btn" href={`${apiBaseUrl}/openapi.json`} target="_blank" rel="noreferrer">
            查看 OpenAPI JSON
          </a>
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            登出
          </button>
        </div>

        <div className="admin-links">
          <Link to="/admin/blog" className="text-link">
            技術文章管理
            <i className="fa-solid fa-arrow-right" />
          </Link>
          <Link to="/admin/login" className="text-link">
            切換帳號
            <i className="fa-solid fa-arrow-right" />
          </Link>
          <Link to="/" className="text-link">
            回首頁
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Admin Workspace</p>
          <h2 className="section-title">管理分頁</h2>
          <p className="section-sub">使用分頁切換不同管理模組，降低單頁資訊密度。</p>
        </div>
        <div className="admin-tab-list" role="tablist" aria-label="後台管理分頁">
          {adminTabOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={activeAdminTab === option.key}
              className={`admin-tab-button ${activeAdminTab === option.key ? 'active' : ''}`}
              onClick={() => setActiveAdminTab(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {activeAdminTab === 'siteContent' ? (
        <section className="section-card reveal">
          <div className="section-head">
            <p className="section-kicker">Site Content Manager</p>
            <h2 className="section-title">網站內容管理</h2>
            <p className="section-sub">拆成多張卡片，可分區編輯首頁、分類、流程與共用資訊。</p>
          </div>

          <form className="admin-site-content-form" onSubmit={handleSaveSiteContent}>
            <div className="admin-site-content-grid">
              <div className="admin-content-block">
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

              <div className="admin-content-block">
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

              <div className="admin-content-block">
                <h3>訂單管理區塊：標題與描述</h3>
                <div className="admin-form-grid">
                  <label className="auth-field" htmlFor="content-brand-hero-title">
                    訂單管理區塊標題
                    <input
                      id="content-brand-hero-title"
                      type="text"
                      value={siteContentForm.brandHeroTitle}
                      onChange={(event) => handleSiteContentFieldChange('brandHeroTitle', event.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="content-brand-hero-subtitle">
                    訂單管理區塊描述
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
                <h3>訂單管理：統一標籤庫</h3>
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
                <p className="admin-note">訂單管理編輯彈窗會優先提供這份標籤供快速勾選。</p>
                <div className="admin-site-tag-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={handleSyncShipmentTagCatalogFromOrders}
                  >
                    從訂單管理同步標籤
                  </button>
                  <span className="admin-note">目前標籤數：{managedShipmentTagCatalog.length}</span>
                </div>
              </div>

              <div className="admin-content-block">
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

              <div className="admin-content-block">
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

              <div className="admin-content-block">
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

              <div className="admin-content-block">
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

            <div className="admin-order-form-actions">
              <button type="submit" className="solid-btn" disabled={isSavingSiteContent}>
                {isSavingSiteContent ? '儲存中...' : '儲存網站內容'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => loadSiteContent()}
                disabled={siteContentLoading}
              >
                重新載入內容
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeAdminTab === 'builds' ? (
        <section className="section-card reveal">
          <div className="section-head">
            <p className="section-kicker">Build Manager</p>
            <h2 className="section-title">推薦配單管理</h2>
            <p className="section-sub">新增或維護首頁「推薦配單」內容，前台會直接同步最新資料。</p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreateBuildModal}>
              新增推薦配單
            </button>
            <button type="button" className="ghost-btn" onClick={() => loadBuilds()} disabled={buildsLoading}>
              重新載入
            </button>
          </div>

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="build-search">
              查詢推薦配單
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
          <div className="section-head">
            <p className="section-kicker">Category Manager</p>
            <h2 className="section-title">分類總覽管理</h2>
            <p className="section-sub">新增後會自動出現在首頁與分類總覽，且會有獨立的前往分類介紹頁。</p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreateCategoryModal}>
              新增分類總覽
            </button>
            <button type="button" className="ghost-btn" onClick={() => loadCategories()} disabled={categoriesLoading}>
              重新載入
            </button>
          </div>

          {categoriesError ? <p className="auth-error">{categoriesError}</p> : null}
          {categoriesSuccess ? <p className="admin-success">{categoriesSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="category-search">
              查詢分類總覽
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
          <div className="section-head">
            <p className="section-kicker">Recent Shipment</p>
            <h2 className="section-title">訂單管理</h2>
            <p className="section-sub">可新增、編輯、刪除訂單管理資料，並可一鍵產出估價單與出機檢查單。</p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreateOrderModal}>
              新增訂單管理
            </button>
            <button type="button" className="ghost-btn" onClick={() => loadOrders()} disabled={ordersLoading}>
              重新載入
            </button>
          </div>

          {ordersError ? <p className="auth-error">{ordersError}</p> : null}
          {ordersSuccess ? <p className="admin-success">{ordersSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="order-search">
              查詢訂單管理
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

          {ordersLoading ? <p className="admin-note">讀取訂單管理中...</p> : null}

          {!ordersLoading && orders.length === 0 ? <p className="admin-note">目前沒有訂單管理資料。</p> : null}
          {!ordersLoading && orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="admin-note">查無符合條件的訂單管理。</p>
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
                          <a className="ghost-btn" href={getOrderDetailPath(order.id)} target="_blank" rel="noreferrer">
                            查看頁面
                          </a>
                          <button type="button" className="ghost-btn" onClick={() => handleGenerateOrderQuotation(order)}>
                            產出估價單
                          </button>
                          <button type="button" className="ghost-btn" onClick={() => handleGenerateOrderChecklist(order)}>
                            產出出機檢查單
                          </button>
                          <button type="button" className="ghost-btn" onClick={() => startEditOrder(order)}>
                            編輯
                          </button>
                          <button
                            type="button"
                            className="ghost-btn order-delete-btn"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deletingOrderId === order.id}
                          >
                            {deletingOrderId === order.id ? '刪除中...' : '刪除'}
                          </button>
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

      {activeAdminTab === 'procurements' ? (
        <section className="section-card reveal">
          <div className="section-head">
            <p className="section-kicker">Peer Procurement</p>
            <h2 className="section-title">同行拿貨紀錄</h2>
            <p className="section-sub">
              每日可新增多筆紀錄，支援多同行、多品項、含稅與未稅價格顯示，並標示本週是否已結清。
            </p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreateProcurementModal}>
              新增拿貨紀錄
            </button>
            <button type="button" className="ghost-btn" onClick={() => loadProcurements()} disabled={procurementsLoading}>
              重新載入
            </button>
          </div>

          {procurementsError ? <p className="auth-error">{procurementsError}</p> : null}
          {procurementsSuccess ? <p className="admin-success">{procurementsSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="procurement-search">
              查詢拿貨紀錄
              <input
                id="procurement-search"
                type="text"
                placeholder="可搜尋日期、同行、盤商、貨源、品名..."
                value={procurementSearchKeyword}
                onChange={(event) => setProcurementSearchKeyword(event.target.value)}
              />
            </label>
            <label className="auth-field admin-search-field" htmlFor="procurement-peer-filter">
              同行篩選
              <select
                id="procurement-peer-filter"
                value={procurementPeerFilter}
                onChange={(event) => setProcurementPeerFilter(event.target.value)}
              >
                <option value="">全部同行</option>
                {procurementPeerOptions.map((peerName) => (
                  <option key={peerName} value={peerName}>
                    {peerName}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field admin-search-field" htmlFor="procurement-settlement-filter">
              本週結清狀態
              <select
                id="procurement-settlement-filter"
                value={procurementSettlementFilter}
                onChange={(event) =>
                  setProcurementSettlementFilter(event.target.value as 'all' | 'settled' | 'unsettled')
                }
              >
                <option value="all">全部</option>
                <option value="settled">{procurementSettlementLabels.settled}</option>
                <option value="unsettled">{procurementSettlementLabels.unsettled}</option>
              </select>
            </label>
            <label className="auth-field admin-search-field" htmlFor="procurement-month-filter">
              月份篩選
              <input
                id="procurement-month-filter"
                type="month"
                value={procurementMonthFilter}
                onChange={(event) => setProcurementMonthFilter(event.target.value)}
              />
            </label>
            {(procurementSearchKeyword ||
              procurementPeerFilter ||
              procurementSettlementFilter !== 'all' ||
              procurementMonthFilter) ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setProcurementSearchKeyword('');
                  setProcurementMonthFilter('');
                  setProcurementPeerFilter('');
                  setProcurementSettlementFilter('all');
                }}
              >
                清除查詢
              </button>
            ) : null}
          </div>

          <div className="admin-procurement-kpi-grid">
            <article className="admin-procurement-kpi-card">
              <span>目前筆數</span>
              <strong>{filteredProcurements.length}</strong>
              <p>同行 {procurementUniquePeerCount} 家 ・ 品項 {procurementTotals.itemCount} 筆</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>篩選總拿貨金額</span>
              <strong>{formatCurrency(procurementTotals.totalAmount)}</strong>
              <p>未稅估算 {formatCurrency(procurementTotals.untaxedTotal)}</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>本週未結清金額</span>
              <strong>{formatCurrency(currentWeekUnsettledAmount)}</strong>
              <p>本週總額 {formatCurrency(currentWeekTotalAmount)}</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>結清與含稅比例</span>
              <strong>{Math.round(procurementSettlementAmountRatio * 100)}%</strong>
              <p>含稅品項占比 {Math.round(procurementTaxIncludedRatio * 100)}%</p>
            </article>
          </div>

          <div className="admin-procurement-chart-grid">
            <article className="admin-procurement-chart-card">
              <h3>每日拿貨金額（最近 10 天）</h3>
              {procurementDailySeries.length > 0 ? (
                <div className="admin-procurement-bar-chart">
                  {procurementDailySeries.map((item) => (
                    <div key={item.date} className="admin-procurement-bar-item">
                      <span className="admin-procurement-bar-value">
                        {formatCurrency(item.amount)}
                      </span>
                      <div className="admin-procurement-bar-track">
                        <div
                          className="admin-procurement-bar-fill"
                          style={{ height: `${Math.max(8, (item.amount / procurementDailyMaxAmount) * 100)}%` }}
                        />
                      </div>
                      <span className="admin-procurement-bar-label">{item.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-note">目前沒有可用的日期資料。</p>
              )}
            </article>

            <article className="admin-procurement-chart-card">
              <h3>同行拿貨金額占比（Top 8）</h3>
              {procurementPeerSeries.length > 0 ? (
                <ul className="admin-procurement-peer-list">
                  {procurementPeerSeries.map((item) => (
                    <li key={item.peerName}>
                      <div className="admin-procurement-peer-head">
                        <strong>{item.peerName}</strong>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="admin-procurement-peer-track">
                        <div
                          className="admin-procurement-peer-fill"
                          style={{ width: `${Math.max(6, (item.amount / procurementPeerMaxAmount) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-note">目前沒有可用的同行資料。</p>
              )}
            </article>
          </div>

          <div className="admin-procurement-settlement-card">
            <div className="admin-procurement-settlement-head">
              <h3>結清狀態（金額）</h3>
              <span>
                已結清 {formatCurrency(procurementTotals.settledAmount)} ・ 未結清{' '}
                {formatCurrency(procurementTotals.unsettledAmount)}
              </span>
            </div>
            <div className="admin-procurement-settlement-track" role="img" aria-label="結清比例圖">
              <div
                className="admin-procurement-settlement-fill settled"
                style={{ width: `${Math.max(0, procurementSettlementAmountRatio * 100)}%` }}
              />
              <div
                className="admin-procurement-settlement-fill unsettled"
                style={{ width: `${Math.max(0, (1 - procurementSettlementAmountRatio) * 100)}%` }}
              />
            </div>
            <p className="admin-note">
              筆數：已結清 {procurementTotals.settledCount} 筆 ・ 未結清 {procurementTotals.unsettledCount} 筆
            </p>
          </div>

          <div className="admin-procurement-weekly-card">
            <div className="admin-procurement-settlement-head">
              <div className="admin-procurement-weekly-actions">
                <h3>當週清單</h3>
                <button
                  type="button"
                  className={`ghost-btn admin-procurement-toggle-btn ${weeklyUnsettledOnly ? 'active' : ''}`}
                  onClick={() => setWeeklyUnsettledOnly((prev) => !prev)}
                >
                  {weeklyUnsettledOnly ? '顯示全部' : '只看未結清'}
                </button>
              </div>
              <span>
                共 {weeklyProcurementDisplayList.length} 筆 ・
                {weeklyUnsettledOnly ? ' 未結清總額 ' : ' 本週總額 '}
                {formatCurrency(weeklyUnsettledOnly ? currentWeekDisplayAmount : currentWeekTotalAmount)}
              </span>
            </div>
            {weeklyProcurementDisplayList.length === 0 ? (
              <p className="admin-note">
                {weeklyUnsettledOnly ? '本週目前沒有未結清的拿貨紀錄。' : '本週目前沒有符合篩選條件的拿貨紀錄。'}
              </p>
            ) : (
              <div className="admin-procurement-table-wrap">
                <table className="admin-procurement-table admin-procurement-weekly-record-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>同行</th>
                      <th>盤商</th>
                      <th>貨源</th>
                      <th>品項數</th>
                      <th>總額</th>
                      <th>狀態</th>
                      <th>快速切換</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedWeeklyProcurementDisplayList.map((row) => {
                      const isToggling = togglingProcurementId === row.procurement.id;
                      return (
                        <tr key={`weekly-record-${row.procurement.id}`}>
                          <td>{row.procurement.date}</td>
                          <td>{row.procurement.peerName}</td>
                          <td>{row.procurement.supplierName}</td>
                          <td>{row.procurement.source}</td>
                          <td>{row.procurement.items.length}</td>
                          <td>{formatCurrency(row.totalAmount)}</td>
                          <td>
                            <span
                              className={`procurement-settlement-badge ${
                                row.procurement.settledThisWeek ? 'settled' : 'unsettled'
                              }`}
                            >
                              {row.procurement.settledThisWeek
                                ? procurementSettlementLabels.settled
                                : procurementSettlementLabels.unsettled}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ghost-btn admin-procurement-quick-toggle-btn"
                              onClick={() => handleToggleProcurementSettled(row.procurement)}
                              disabled={isToggling}
                            >
                              {isToggling ? '更新中...' : row.procurement.settledThisWeek ? '改為未結清' : '標記已結清'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {weeklyProcurementDisplayList.length > WEEKLY_PROCUREMENT_PAGE_SIZE ? (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setWeeklyProcurementPage(safeWeeklyProcurementPage - 1)}
                  disabled={safeWeeklyProcurementPage <= 1}
                >
                  上一頁
                </button>
                <span className="admin-pagination-status">
                  第 {safeWeeklyProcurementPage} / {weeklyProcurementTotalPages} 頁（共 {weeklyProcurementDisplayList.length}{' '}
                  筆）
                </span>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setWeeklyProcurementPage(safeWeeklyProcurementPage + 1)}
                  disabled={safeWeeklyProcurementPage >= weeklyProcurementTotalPages}
                >
                  下一頁
                </button>
              </div>
            ) : null}

            <div className="admin-procurement-weekly-summary-head">
              <h4>同行當週欠款總結（未結清）</h4>
              <span>
                {weeklyUnsettledPeerSummaries.length} 家同行 ・ 欠款總額 {formatCurrency(currentWeekUnsettledAmount)}
              </span>
            </div>

            {weeklyUnsettledPeerSummaries.length === 0 ? (
              <p className="admin-note">本週目前沒有未結清欠款。</p>
            ) : (
              <div className="admin-procurement-weekly-summary-grid">
                {weeklyUnsettledPeerSummaries.map((peerSummary) => (
                  <article key={`weekly-peer-${peerSummary.peerName}`} className="admin-procurement-peer-summary-card">
                    <div className="admin-procurement-peer-summary-head">
                      <strong>{peerSummary.peerName}</strong>
                      <span>{formatCurrency(peerSummary.totalAmount)}</span>
                    </div>
                    <p className="admin-procurement-peer-summary-meta">
                      共 {peerSummary.recordCount} 筆 ・ 盤商：{peerSummary.suppliers.join('、')} ・ 貨源：
                      {peerSummary.sources.join('、')}
                    </p>
                    <div className="admin-procurement-table-wrap">
                      <table className="admin-procurement-table">
                        <thead>
                          <tr>
                            <th>品項</th>
                            <th>數量合計</th>
                            <th>稅別</th>
                            <th>金額合計</th>
                            <th>未稅金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peerSummary.items.map((item) => (
                            <tr
                              key={`weekly-peer-item-${peerSummary.peerName}-${item.productName}-${item.taxIncluded ? '1' : '0'}`}
                            >
                              <td>{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>{item.taxIncluded ? '含稅' : '未稅'}</td>
                              <td>{formatCurrency(item.totalAmount)}</td>
                              <td>{formatCurrency(item.untaxedTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4}>同行總額</td>
                            <td>{formatCurrency(peerSummary.totalAmount)}</td>
                          </tr>
                          <tr>
                            <td colSpan={4}>同行未稅總額</td>
                            <td>{formatCurrency(peerSummary.untaxedTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {procurementsLoading ? <p className="admin-note">讀取拿貨紀錄中...</p> : null}
          {!procurementsLoading && procurements.length === 0 ? <p className="admin-note">目前沒有拿貨紀錄。</p> : null}
          {!procurementsLoading && procurements.length > 0 && filteredProcurements.length === 0 ? (
            <p className="admin-note">查無符合條件的拿貨紀錄。</p>
          ) : null}

          <div className="admin-order-list">
            {pagedProcurements.map((procurement) => {
              const totalAmount = procurement.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
              const untaxedTotal = procurement.items.reduce((sum, item) => {
                return sum + item.quantity * calculateUntaxedPrice(item.unitPrice, item.taxIncluded);
              }, 0);
              const hasTaxIncludedItems = procurement.items.some((item) => item.taxIncluded);
              const hasUntaxedItems = procurement.items.some((item) => !item.taxIncluded);
              const taxModeLabel =
                hasTaxIncludedItems && hasUntaxedItems
                  ? '含稅/未稅混合'
                  : hasTaxIncludedItems
                    ? '含稅報價'
                    : '未稅報價';

              return (
                <article key={procurement.id} className="admin-order-item">
                  <div className="admin-order-top">
                    <strong>{procurement.peerName}</strong>
                    <span
                      className={`procurement-settlement-badge ${
                        procurement.settledThisWeek ? 'settled' : 'unsettled'
                      }`}
                    >
                      {procurement.settledThisWeek
                        ? procurementSettlementLabels.settled
                        : procurementSettlementLabels.unsettled}
                    </span>
                  </div>

                  <p>
                    {procurement.date} ・ 盤商：{procurement.supplierName}
                  </p>
                  <p>
                    貨源：{procurement.source} ・ {taxModeLabel}
                  </p>

                  <div className="admin-procurement-table-wrap">
                    <table className="admin-procurement-table">
                      <thead>
                        <tr>
                          <th>品名</th>
                          <th>數量</th>
                          <th>稅別</th>
                          <th>單價</th>
                          <th>未稅單價</th>
                          <th>小計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procurement.items.map((item, index) => (
                          <tr key={`${procurement.id}-item-${index}`}>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.taxIncluded ? '含稅' : '未稅'}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(calculateUntaxedPrice(item.unitPrice, item.taxIncluded))}</td>
                            <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5}>總額</td>
                          <td>{formatCurrency(totalAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={5}>未稅總額</td>
                          <td>{formatCurrency(untaxedTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {procurement.note ? <p className="admin-note">備註：{procurement.note}</p> : null}

                  <div className="admin-order-item-actions">
                    <button type="button" className="ghost-btn" onClick={() => startEditProcurement(procurement)}>
                      編輯
                    </button>
                    <button
                      type="button"
                      className="ghost-btn order-delete-btn"
                      onClick={() => handleDeleteProcurement(procurement)}
                      disabled={deletingProcurementId === procurement.id}
                    >
                      {deletingProcurementId === procurement.id ? '刪除中...' : '刪除'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProcurements.length > PROCUREMENT_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setProcurementPage(safeProcurementPage - 1)}
                disabled={safeProcurementPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safeProcurementPage} / {procurementTotalPages} 頁（共 {filteredProcurements.length} 筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setProcurementPage(safeProcurementPage + 1)}
                disabled={safeProcurementPage >= procurementTotalPages}
              >
                下一頁
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeAdminTab === 'personalProcurements' ? (
        <section className="section-card reveal">
          <div className="section-head">
            <p className="section-kicker">Company Procurement</p>
            <h2 className="section-title">公司進貨紀錄</h2>
            <p className="section-sub">用來記錄公司進貨明細，並可彙整當月資料後下載報表。</p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreatePersonalProcurementModal}>
              新增公司進貨
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => loadPersonalProcurements()}
              disabled={personalProcurementsLoading}
            >
              重新載入
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleDownloadPersonalMonthlyReport}
              disabled={currentMonthPersonalProcurementRows.length === 0}
            >
              下載月份報表
            </button>
          </div>

          {personalProcurementsError ? <p className="auth-error">{personalProcurementsError}</p> : null}
          {personalProcurementsSuccess ? <p className="admin-success">{personalProcurementsSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="company-procurement-search">
              查詢公司進貨紀錄
              <input
                id="company-procurement-search"
                type="text"
                placeholder="可搜尋日期、供應商、貨源、品名..."
                value={personalProcurementSearchKeyword}
                onChange={(event) => setPersonalProcurementSearchKeyword(event.target.value)}
              />
            </label>
            <label className="auth-field" htmlFor="company-procurement-month-filter">
              月份篩選
              <input
                id="company-procurement-month-filter"
                type="month"
                value={personalProcurementMonthFilter}
                onChange={(event) => setPersonalProcurementMonthFilter(event.target.value)}
              />
            </label>
            {personalProcurementSearchKeyword || personalProcurementMonthFilter ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setPersonalProcurementSearchKeyword('');
                  setPersonalProcurementMonthFilter('');
                }}
              >
                清除查詢
              </button>
            ) : null}
          </div>

          <div className="admin-procurement-kpi-grid">
            <article className="admin-procurement-kpi-card">
              <span>{personalProcurementSummaryLabel} 進貨筆數</span>
              <strong>{currentMonthPersonalProcurementTotals.recordCount}</strong>
              <p>供應商 {currentMonthPersonalProcurementTotals.suppliers.size} 家</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>{personalProcurementSummaryLabel} 品項 / 數量</span>
              <strong>{currentMonthPersonalProcurementTotals.itemCount}</strong>
              <p>總數量 {currentMonthPersonalProcurementTotals.quantity}</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>{personalProcurementSummaryLabel} 含稅總額</span>
              <strong>{formatCurrency(currentMonthPersonalProcurementTotals.totalAmount)}</strong>
              <p>可直接對帳本月進貨成本</p>
            </article>
            <article className="admin-procurement-kpi-card">
              <span>{personalProcurementSummaryLabel} 未稅總額</span>
              <strong>{formatCurrency(currentMonthPersonalProcurementTotals.untaxedTotal)}</strong>
              <p>方便月報與稅務估算</p>
            </article>
          </div>

          <div className="admin-procurement-chart-grid">
            <article className="admin-procurement-chart-card">
              <h3>{personalProcurementSummaryLabel} 供應商進貨金額</h3>
              {sortedCurrentMonthPersonalSupplierSeries.length > 0 ? (
                <ul className="admin-procurement-peer-list">
                  {sortedCurrentMonthPersonalSupplierSeries.slice(0, 8).map((item) => (
                    <li key={`personal-supplier-${item.supplierName}`}>
                      <div className="admin-procurement-peer-head">
                        <strong>{item.supplierName}</strong>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="admin-procurement-peer-track">
                        <div
                          className="admin-procurement-peer-fill"
                          style={{
                            width: `${Math.max(
                              6,
                              (item.amount / Math.max(sortedCurrentMonthPersonalSupplierSeries[0]?.amount || 1, 1)) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-note">本月目前沒有供應商資料。</p>
              )}
            </article>
          </div>

          {personalProcurementsLoading ? <p className="admin-note">讀取公司進貨紀錄中...</p> : null}
          {!personalProcurementsLoading && personalProcurements.length === 0 ? (
            <p className="admin-note">目前沒有公司進貨紀錄。</p>
          ) : null}
          {!personalProcurementsLoading && personalProcurements.length > 0 && filteredPersonalProcurements.length === 0 ? (
            <p className="admin-note">查無符合條件的公司進貨紀錄。</p>
          ) : null}

          <div className="admin-order-list">
            {pagedPersonalProcurements.map((procurement) => {
              const totalAmount = procurement.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
              const untaxedTotal = procurement.items.reduce((sum, item) => {
                return sum + item.quantity * calculateUntaxedPrice(item.unitPrice, item.taxIncluded);
              }, 0);
              const hasTaxIncludedItems = procurement.items.some((item) => item.taxIncluded);
              const hasUntaxedItems = procurement.items.some((item) => !item.taxIncluded);
              const taxModeLabel =
                hasTaxIncludedItems && hasUntaxedItems
                  ? '含稅/未稅混合'
                  : hasTaxIncludedItems
                    ? '含稅報價'
                    : '未稅報價';

              return (
                <article key={procurement.id} className="admin-order-item">
                  <div className="admin-order-top">
                    <strong>{procurement.supplierName}</strong>
                    <span className="procurement-settlement-badge settled">公司帳</span>
                  </div>

                  <p>
                    {procurement.date} ・ 貨源：{procurement.source}
                  </p>
                  <p>{taxModeLabel}</p>

                  <div className="admin-procurement-table-wrap">
                    <table className="admin-procurement-table">
                      <thead>
                        <tr>
                          <th>品名</th>
                          <th>數量</th>
                          <th>稅別</th>
                          <th>單價</th>
                          <th>未稅單價</th>
                          <th>小計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procurement.items.map((item, index) => (
                          <tr key={`${procurement.id}-item-${index}`}>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.taxIncluded ? '含稅' : '未稅'}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(calculateUntaxedPrice(item.unitPrice, item.taxIncluded))}</td>
                            <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5}>總額</td>
                          <td>{formatCurrency(totalAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={5}>未稅總額</td>
                          <td>{formatCurrency(untaxedTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {procurement.note ? <p className="admin-note">備註：{procurement.note}</p> : null}

                  <div className="admin-order-item-actions">
                    <button type="button" className="ghost-btn" onClick={() => startEditPersonalProcurement(procurement)}>
                      編輯
                    </button>
                    <button
                      type="button"
                      className="ghost-btn order-delete-btn"
                      onClick={() => handleDeletePersonalProcurement(procurement)}
                      disabled={deletingPersonalProcurementId === procurement.id}
                    >
                      {deletingPersonalProcurementId === procurement.id ? '刪除中...' : '刪除'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPersonalProcurements.length > PERSONAL_PROCUREMENT_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setPersonalProcurementPage(safePersonalProcurementPage - 1)}
                disabled={safePersonalProcurementPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safePersonalProcurementPage} / {personalProcurementTotalPages} 頁（共 {filteredPersonalProcurements.length}{' '}
                筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setPersonalProcurementPage(safePersonalProcurementPage + 1)}
                disabled={safePersonalProcurementPage >= personalProcurementTotalPages}
              >
                下一頁
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeAdminTab === 'inventories' ? (
        <section className="section-card reveal">
          <div className="section-head">
            <p className="section-kicker">Inventory Manager</p>
            <h2 className="section-title">庫存管理</h2>
            <p className="section-sub">
              管理 CPU / 主機板 / 顯示卡 / 記憶體 / SSD / HDD / 散熱器 / 電源供應器 / 機殼，並記錄末端價格與進貨成本。
            </p>
          </div>

          <div className="admin-order-form-actions">
            <button type="button" className="solid-btn" onClick={openCreateInventoryModal}>
              新增庫存品項
            </button>
            <button type="button" className="ghost-btn" onClick={() => loadInventories()} disabled={inventoriesLoading}>
              重新載入
            </button>
          </div>

          {inventoriesError ? <p className="auth-error">{inventoriesError}</p> : null}
          {inventoriesSuccess ? <p className="admin-success">{inventoriesSuccess}</p> : null}

          <div className="admin-list-tools">
            <label className="auth-field admin-search-field" htmlFor="inventory-search">
              查詢庫存
              <input
                id="inventory-search"
                type="text"
                placeholder="可搜尋品名、廠牌、分類、備註..."
                value={inventorySearchKeyword}
                onChange={(event) => setInventorySearchKeyword(event.target.value)}
              />
            </label>
            <label className="auth-field admin-search-field" htmlFor="inventory-category-filter">
              分類篩選
              <select
                id="inventory-category-filter"
                value={inventoryCategoryFilter}
                onChange={(event) =>
                  setInventoryCategoryFilter(
                    event.target.value === 'all' ? 'all' : (event.target.value as InventoryCategory),
                  )
                }
              >
                <option value="all">全部分類</option>
                {inventoryCategories.map((category) => (
                  <option key={category} value={category}>
                    {inventoryCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field admin-search-field" htmlFor="inventory-brand-filter">
              廠牌篩選
              <select
                id="inventory-brand-filter"
                value={inventoryBrandFilter}
                onChange={(event) => setInventoryBrandFilter(event.target.value)}
              >
                <option value="">全部廠牌</option>
                {inventoryBrandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            {(inventorySearchKeyword || inventoryCategoryFilter !== 'all' || inventoryBrandFilter) ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setInventorySearchKeyword('');
                  setInventoryCategoryFilter('all');
                  setInventoryBrandFilter('');
                }}
              >
                清除查詢
              </button>
            ) : null}
          </div>

          {inventoriesLoading ? <p className="admin-note">讀取庫存中...</p> : null}
          {!inventoriesLoading && inventories.length === 0 ? <p className="admin-note">目前沒有庫存資料。</p> : null}
          {!inventoriesLoading && inventories.length > 0 && filteredInventories.length === 0 ? (
            <p className="admin-note">查無符合條件的庫存項目。</p>
          ) : null}

          {filteredInventories.length > 0 ? (
            <div className="admin-procurement-settlement-card admin-inventory-chart-card">
              <div className="admin-procurement-settlement-head">
                <h3>庫存類別金額統計（未稅）</h3>
                <span>
                  末端總額 {formatCurrency(inventoryCategoryRetailTotal)} ・ 成本總額{' '}
                  {formatCurrency(inventoryCategoryCostTotal)} ・ 毛利總額{' '}
                  {formatSignedCurrency(inventoryCategoryRetailTotal - inventoryCategoryCostTotal)}
                </span>
              </div>

              {inventoryCategoryAmountSeries.length === 0 ? (
                <p className="admin-note">目前沒有可統計的類別資料。</p>
              ) : (
                <ul className="admin-procurement-peer-list">
                  {inventoryCategoryAmountSeries.map((item) => (
                    <li key={`inventory-amount-${item.category}`}>
                      <div className="admin-procurement-peer-head">
                        <strong>{inventoryCategoryLabels[item.category]}</strong>
                        <span>{formatCurrency(item.retailAmount)}</span>
                      </div>
                      <div className="admin-procurement-peer-track">
                        <div
                          className="admin-procurement-peer-fill"
                          style={{ width: `${Math.max(6, (item.retailAmount / inventoryCategoryAmountMax) * 100)}%` }}
                        />
                      </div>
                      <p className="admin-inventory-chart-meta">
                        成本 {formatCurrency(item.costAmount)} ・ 毛利{' '}
                        {formatSignedCurrency(item.retailAmount - item.costAmount)} ・ 數量 {item.quantity} ・ 品項{' '}
                        {item.itemCount}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {filteredInventories.length > 0 ? (
            <div className="admin-procurement-table-wrap admin-inventory-table-wrap">
              <table
                className={`admin-procurement-table admin-inventory-table ${
                  showInventoryMotherboardColumn ? 'show-mb-col' : 'hide-mb-col'
                }`}
              >
                <thead>
                  <tr>
                    <th className="inventory-col-center">分類</th>
                    <th className="inventory-col-left">廠牌</th>
                    <th className="inventory-col-left">品名</th>
                    {showInventoryMotherboardColumn ? <th className="inventory-col-center">主機板尺寸</th> : null}
                    <th className="inventory-col-right">庫存</th>
                    <th className="inventory-col-center">稅別</th>
                    <th className="inventory-col-right">末端價格</th>
                    <th className="inventory-col-right">進貨成本</th>
                    <th className="inventory-col-right">單件毛利（未稅）</th>
                    <th className="inventory-col-left">備註</th>
                    <th className="inventory-col-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInventories.map((inventory) => {
                    const untaxedRetailPrice = calculateUntaxedPrice(inventory.retailPrice, inventory.taxIncluded);
                    const untaxedCostPrice = calculateUntaxedPrice(inventory.costPrice, inventory.taxIncluded);
                    const untaxedGrossProfit = untaxedRetailPrice - untaxedCostPrice;

                    return (
                      <tr key={inventory.id}>
                        <td className="inventory-col-center">
                          <span className="inventory-category-badge">{inventoryCategoryLabels[inventory.category]}</span>
                        </td>
                        <td className="inventory-col-left">{inventory.brand}</td>
                        <td className="inventory-col-left">{inventory.productName}</td>
                        {showInventoryMotherboardColumn ? (
                          <td className="inventory-col-center">{inventory.motherboardFormFactor || '未標示'}</td>
                        ) : null}
                        <td className="inventory-col-right">{inventory.quantity}</td>
                        <td className="inventory-col-center">
                          <span className={`inventory-tax-badge ${inventory.taxIncluded ? 'included' : 'excluded'}`}>
                            {inventory.taxIncluded ? '含稅' : '未稅'}
                          </span>
                        </td>
                        <td className="inventory-col-right">{formatCurrency(inventory.retailPrice)}</td>
                        <td className="inventory-col-right">{formatCurrency(inventory.costPrice)}</td>
                        <td className="inventory-col-right">{formatSignedCurrency(untaxedGrossProfit)}</td>
                        <td className="inventory-col-left inventory-col-note">{inventory.note || '-'}</td>
                        <td className="inventory-col-center">
                          <div className="admin-inventory-actions">
                            <button type="button" className="ghost-btn" onClick={() => startEditInventory(inventory)}>
                              編輯
                            </button>
                            <button
                              type="button"
                              className="ghost-btn order-delete-btn"
                              onClick={() => handleDeleteInventory(inventory)}
                              disabled={deletingInventoryId === inventory.id}
                            >
                              {deletingInventoryId === inventory.id ? '刪除中...' : '刪除'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {filteredInventories.length > INVENTORY_PAGE_SIZE ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setInventoryPage(safeInventoryPage - 1)}
                disabled={safeInventoryPage <= 1}
              >
                上一頁
              </button>
              <span className="admin-pagination-status">
                第 {safeInventoryPage} / {inventoryTotalPages} 頁（共 {filteredInventories.length} 筆）
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setInventoryPage(safeInventoryPage + 1)}
                disabled={safeInventoryPage >= inventoryTotalPages}
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

      {isProcurementEditModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetProcurementForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-procurement-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-procurement-title">{editingProcurementId ? '編輯拿貨紀錄' : '新增拿貨紀錄'}</h3>
              <button type="button" className="admin-modal-close" onClick={resetProcurementForm}>
                關閉
              </button>
            </div>

            <form className="admin-order-form" onSubmit={handleSaveProcurement}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="edit-procurement-date">
                  日期（YYYY/MM/DD）
                  <input
                    id="edit-procurement-date"
                    type="text"
                    placeholder="2026/02/13"
                    value={procurementForm.date}
                    onChange={(event) => handleProcurementFieldChange('date', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-procurement-peer-name">
                  同行名稱
                  <input
                    id="edit-procurement-peer-name"
                    type="text"
                    placeholder="例如：高雄同行 A"
                    value={procurementForm.peerName}
                    onChange={(event) => handleProcurementFieldChange('peerName', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-procurement-supplier-name">
                  盤商
                  <input
                    id="edit-procurement-supplier-name"
                    type="text"
                    placeholder="例如：原價屋建國店"
                    value={procurementForm.supplierName}
                    onChange={(event) => handleProcurementFieldChange('supplierName', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-procurement-source">
                  貨源
                  <input
                    id="edit-procurement-source"
                    type="text"
                    placeholder="例如：門市現貨 / 代理商直送"
                    value={procurementForm.source}
                    onChange={(event) => handleProcurementFieldChange('source', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-procurement-tax-included">
                  預設稅務狀態（新增品項時套用）
                  <select
                    id="edit-procurement-tax-included"
                    value={procurementForm.taxIncluded ? 'included' : 'excluded'}
                    onChange={(event) =>
                      handleProcurementFieldChange('taxIncluded', event.target.value === 'included')
                    }
                  >
                    <option value="included">含稅</option>
                    <option value="excluded">未稅</option>
                  </select>
                </label>

                <label className="auth-field" htmlFor="edit-procurement-settled-this-week">
                  本週結清狀態
                  <select
                    id="edit-procurement-settled-this-week"
                    value={procurementForm.settledThisWeek ? 'settled' : 'unsettled'}
                    onChange={(event) =>
                      handleProcurementFieldChange('settledThisWeek', event.target.value === 'settled')
                    }
                  >
                    <option value="unsettled">{procurementSettlementLabels.unsettled}</option>
                    <option value="settled">{procurementSettlementLabels.settled}</option>
                  </select>
                </label>

                <div className="auth-field admin-field-wide">
                  <span>拿貨品項</span>
                  <div className="admin-multi-input-list">
                    {procurementItems.map((item, index) => (
                      <div key={`procurement-item-${index}`} className="admin-multi-input-row procurement-item-row">
                        <input
                          id={`edit-procurement-product-name-${index}`}
                          type="text"
                          placeholder="品名（例如：RTX 5070 12GB）"
                          value={item.productName}
                          onChange={(event) =>
                            handleProcurementItemFieldChange(index, 'productName', event.target.value)
                          }
                        />
                        <input
                          id={`edit-procurement-quantity-${index}`}
                          type="number"
                          min={1}
                          step={1}
                          placeholder="數量"
                          value={item.quantityText}
                          onChange={(event) =>
                            handleProcurementItemFieldChange(index, 'quantityText', event.target.value)
                          }
                        />
                        <input
                          id={`edit-procurement-unit-price-${index}`}
                          type="number"
                          min={0}
                          step={1}
                          placeholder="單價"
                          value={item.unitPriceText}
                          onChange={(event) =>
                            handleProcurementItemFieldChange(index, 'unitPriceText', event.target.value)
                          }
                        />
                        <select
                          id={`edit-procurement-tax-mode-${index}`}
                          value={item.taxIncluded ? 'included' : 'excluded'}
                          onChange={(event) =>
                            handleProcurementItemFieldChange(index, 'taxIncluded', event.target.value === 'included')
                          }
                          aria-label={`第 ${index + 1} 筆品項稅務狀態`}
                        >
                          <option value="included">含稅</option>
                          <option value="excluded">未稅</option>
                        </select>
                        {procurementItems.length > 1 ? (
                          <button
                            type="button"
                            className="ghost-btn admin-icon-btn"
                            onClick={() => handleRemoveProcurementItem(index)}
                            aria-label={`移除第 ${index + 1} 筆品項`}
                          >
                            -
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button type="button" className="ghost-btn admin-add-storage-btn" onClick={handleAddProcurementItem}>
                      + 新增品項
                    </button>
                  </div>
                </div>

                <label className="auth-field admin-field-wide" htmlFor="edit-procurement-note">
                  備註（可空白）
                  <textarea
                    id="edit-procurement-note"
                    rows={3}
                    placeholder="例如：含運、代墊、待補發票..."
                    value={procurementForm.note}
                    onChange={(event) => handleProcurementFieldChange('note', event.target.value)}
                  />
                </label>
              </div>

              <p className="admin-note">
                每個品項都可獨立選擇「含稅 / 未稅」，系統會自動換算未稅單價與未稅總額。
              </p>

              {procurementsError ? <p className="auth-error">{procurementsError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingProcurement}>
                  {isSavingProcurement ? '儲存中...' : editingProcurementId ? '儲存變更' : '新增拿貨紀錄'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetProcurementForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isPersonalProcurementEditModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetPersonalProcurementForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-company-procurement-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-company-procurement-title">
                {editingPersonalProcurementId ? '編輯公司進貨紀錄' : '新增公司進貨紀錄'}
              </h3>
              <button type="button" className="admin-modal-close" onClick={resetPersonalProcurementForm}>
                關閉
              </button>
            </div>

            <form className="admin-order-form" onSubmit={handleSavePersonalProcurement}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="edit-company-procurement-date">
                  日期（YYYY/MM/DD）
                  <input
                    id="edit-company-procurement-date"
                    type="text"
                    placeholder="2026/02/13"
                    value={personalProcurementForm.date}
                    onChange={(event) => handlePersonalProcurementFieldChange('date', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-company-procurement-supplier-name">
                  供應商
                  <input
                    id="edit-company-procurement-supplier-name"
                    type="text"
                    placeholder="例如：原價屋建國店"
                    value={personalProcurementForm.supplierName}
                    onChange={(event) => handlePersonalProcurementFieldChange('supplierName', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-company-procurement-source">
                  貨源
                  <input
                    id="edit-company-procurement-source"
                    type="text"
                    placeholder="例如：門市現貨 / 代理商直送"
                    value={personalProcurementForm.source}
                    onChange={(event) => handlePersonalProcurementFieldChange('source', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-company-procurement-tax-included">
                  預設稅務狀態（新增品項時套用）
                  <select
                    id="edit-company-procurement-tax-included"
                    value={personalProcurementForm.taxIncluded ? 'included' : 'excluded'}
                    onChange={(event) =>
                      handlePersonalProcurementFieldChange('taxIncluded', event.target.value === 'included')
                    }
                  >
                    <option value="included">含稅</option>
                    <option value="excluded">未稅</option>
                  </select>
                </label>

                <div className="auth-field admin-field-wide">
                  <span>進貨品項</span>
                  <div className="admin-multi-input-list">
                    {personalProcurementItems.map((item, index) => (
                      <div
                        key={`company-procurement-item-${index}`}
                        className="admin-multi-input-row procurement-item-row"
                      >
                        <input
                          id={`edit-company-procurement-product-name-${index}`}
                          type="text"
                          placeholder="品名（例如：RTX 5070 12GB）"
                          value={item.productName}
                          onChange={(event) =>
                            handlePersonalProcurementItemFieldChange(index, 'productName', event.target.value)
                          }
                        />
                        <input
                          id={`edit-company-procurement-quantity-${index}`}
                          type="number"
                          min={1}
                          step={1}
                          placeholder="數量"
                          value={item.quantityText}
                          onChange={(event) =>
                            handlePersonalProcurementItemFieldChange(index, 'quantityText', event.target.value)
                          }
                        />
                        <input
                          id={`edit-company-procurement-unit-price-${index}`}
                          type="number"
                          min={0}
                          step={1}
                          placeholder="單價"
                          value={item.unitPriceText}
                          onChange={(event) =>
                            handlePersonalProcurementItemFieldChange(index, 'unitPriceText', event.target.value)
                          }
                        />
                        <select
                          id={`edit-company-procurement-tax-mode-${index}`}
                          value={item.taxIncluded ? 'included' : 'excluded'}
                          onChange={(event) =>
                            handlePersonalProcurementItemFieldChange(
                              index,
                              'taxIncluded',
                              event.target.value === 'included',
                            )
                          }
                          aria-label={`第 ${index + 1} 筆品項稅務狀態`}
                        >
                          <option value="included">含稅</option>
                          <option value="excluded">未稅</option>
                        </select>
                        {personalProcurementItems.length > 1 ? (
                          <button
                            type="button"
                            className="ghost-btn admin-icon-btn"
                            onClick={() => handleRemovePersonalProcurementItem(index)}
                            aria-label={`移除第 ${index + 1} 筆品項`}
                          >
                            -
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ghost-btn admin-add-storage-btn"
                      onClick={handleAddPersonalProcurementItem}
                    >
                      + 新增品項
                    </button>
                  </div>
                </div>

                <label className="auth-field admin-field-wide" htmlFor="edit-company-procurement-note">
                  備註（可空白）
                  <textarea
                    id="edit-company-procurement-note"
                    rows={3}
                    placeholder="例如：到貨時間、對帳備註..."
                    value={personalProcurementForm.note}
                    onChange={(event) => handlePersonalProcurementFieldChange('note', event.target.value)}
                  />
                </label>
              </div>

              <p className="admin-note">每個品項可獨立設定含稅 / 未稅，報表會同步輸出未稅換算金額。</p>

              {personalProcurementsError ? <p className="auth-error">{personalProcurementsError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingPersonalProcurement}>
                  {isSavingPersonalProcurement
                    ? '儲存中...'
                    : editingPersonalProcurementId
                      ? '儲存變更'
                      : '新增公司進貨紀錄'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetPersonalProcurementForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isInventoryEditModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetInventoryForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-inventory-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-inventory-title">{editingInventoryId ? '編輯庫存品項' : '新增庫存品項'}</h3>
              <button type="button" className="admin-modal-close" onClick={resetInventoryForm}>
                關閉
              </button>
            </div>

            <form className="admin-order-form" onSubmit={handleSaveInventory}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="edit-inventory-category">
                  分類
                  <select
                    id="edit-inventory-category"
                    value={inventoryForm.category}
                    onChange={(event) =>
                      handleInventoryFieldChange('category', event.target.value as InventoryCategory)
                    }
                  >
                    {inventoryCategories.map((category) => (
                      <option key={category} value={category}>
                        {inventoryCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="auth-field" htmlFor="edit-inventory-brand">
                  廠牌
                  <input
                    id="edit-inventory-brand"
                    type="text"
                    list="inventory-brand-preset"
                    value={inventoryForm.brand}
                    onChange={(event) => handleInventoryFieldChange('brand', event.target.value)}
                  />
                  <datalist id="inventory-brand-preset">
                    {inventoryBrandPresets[inventoryForm.category].map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-inventory-product-name">
                  品名
                  <input
                    id="edit-inventory-product-name"
                    type="text"
                    placeholder="例如：ROG STRIX B650-A GAMING WIFI"
                    value={inventoryForm.productName}
                    onChange={(event) => handleInventoryFieldChange('productName', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-inventory-motherboard-form-factor">
                  主機板尺寸
                  <select
                    id="edit-inventory-motherboard-form-factor"
                    value={inventoryForm.motherboardFormFactor}
                    onChange={(event) => handleInventoryFieldChange('motherboardFormFactor', event.target.value)}
                    disabled={inventoryForm.category !== 'motherboard'}
                  >
                    <option value="">不適用</option>
                    {inventoryMotherboardFormFactors.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="auth-field" htmlFor="edit-inventory-quantity">
                  庫存數量
                  <input
                    id="edit-inventory-quantity"
                    type="number"
                    min={0}
                    step={1}
                    value={inventoryForm.quantityText}
                    onChange={(event) => handleInventoryFieldChange('quantityText', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-inventory-tax-included">
                  稅別
                  <select
                    id="edit-inventory-tax-included"
                    value={inventoryForm.taxIncluded ? 'included' : 'excluded'}
                    onChange={(event) => handleInventoryFieldChange('taxIncluded', event.target.value === 'included')}
                  >
                    <option value="included">含稅</option>
                    <option value="excluded">未稅</option>
                  </select>
                </label>

                <label className="auth-field" htmlFor="edit-inventory-retail-price">
                  末端價格
                  <input
                    id="edit-inventory-retail-price"
                    type="number"
                    min={0}
                    step={1}
                    value={inventoryForm.retailPriceText}
                    onChange={(event) => handleInventoryFieldChange('retailPriceText', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="edit-inventory-cost-price">
                  進貨成本
                  <input
                    id="edit-inventory-cost-price"
                    type="number"
                    min={0}
                    step={1}
                    value={inventoryForm.costPriceText}
                    onChange={(event) => handleInventoryFieldChange('costPriceText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="edit-inventory-note">
                  備註（可空白）
                  <textarea
                    id="edit-inventory-note"
                    rows={3}
                    value={inventoryForm.note}
                    onChange={(event) => handleInventoryFieldChange('note', event.target.value)}
                  />
                </label>
              </div>

              {inventoriesError ? <p className="auth-error">{inventoriesError}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSavingInventory}>
                  {isSavingInventory ? '儲存中...' : editingInventoryId ? '儲存變更' : '新增庫存品項'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetInventoryForm}>
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
              <h3 id="edit-order-title">{editingOrderId ? '編輯訂單管理' : '新增訂單管理'}</h3>
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
                  {isSavingOrder ? '儲存中...' : editingOrderId ? '儲存變更' : '新增訂單管理'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetOrderForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
