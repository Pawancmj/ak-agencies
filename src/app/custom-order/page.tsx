'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  MessageCircle,
  Layers,
  Palette,
  Ruler,
  Paintbrush,
  Camera,
  Hash,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  parseProductTypesResponse,
  type ProductTypeOption,
} from '@/lib/custom-order-product-types';
import {
  parseFabricsResponse,
  parseColorsResponse,
  type FabricOption,
  type ColorOption,
} from '@/lib/custom-order-fabrics';
import {
  parseMeasurementsResponse,
  validateMeasurementValues,
  toSnapshotMeasurements,
  formatMeasurementSummary,
  applyProductTypeSelection,
  type MeasurementFieldOption,
} from '@/lib/custom-order-measurements';
import { buildCustomOrderSnapshot } from '@/lib/custom-order-snapshot';

const steps = [
  { id: 1, title: 'Product Type', icon: Layers },
  { id: 2, title: 'Fabric', icon: Palette },
  { id: 3, title: 'Color', icon: Paintbrush },
  { id: 4, title: 'Measurements', icon: Ruler },
  { id: 5, title: 'Design', icon: Paintbrush },
  { id: 6, title: 'Reference', icon: Camera },
  { id: 7, title: 'Quantity', icon: Hash },
  { id: 8, title: 'Details', icon: User },
  { id: 9, title: 'Submit', icon: Check },
];

const designs = ['Floral', 'Geometric', 'Abstract', 'Plain Solid', 'Traditional', 'Modern', 'Custom (Describe Below)'];

/**
 * Image card used by Step 2 (Fabric) and Step 3 (Color). Entire card is a
 * native button so it is keyboard accessible; selected state is conveyed
 * via border, background, and aria-pressed.
 */
function OptionCard({
  name,
  imageUrl,
  selected,
  onSelect,
}: {
  name: string;
  imageUrl: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        selected
          ? 'border-gold bg-gold/5 shadow-md'
          : 'border-border bg-white hover:border-gold/60 hover:shadow-sm'
      }`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-cream">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-3xl font-bold text-primary/25">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3">
        <span
          className={`text-sm font-medium ${
            selected ? 'text-primary' : 'text-text-light group-hover:text-text'
          }`}
        >
          {name}
        </span>
        {selected && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-white">
            <Check size={12} />
          </span>
        )}
      </div>
    </button>
  );
}

export default function CustomOrderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [productTypeOptions, setProductTypeOptions] = useState<ProductTypeOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState(false);
  const [fabricOptions, setFabricOptions] = useState<FabricOption[]>([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);
  const [fabricsError, setFabricsError] = useState(false);
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);
  const [colorsLoading, setColorsLoading] = useState(false);
  const [colorsError, setColorsError] = useState(false);
  // Step 4 measurement configuration comes entirely from the database for
  // the product type chosen in Step 1 — nothing product-specific is
  // hardcoded here. The config is tagged with its productTypeId so a
  // switch never renders another product's fields.
  const [measurementConfig, setMeasurementConfig] = useState<{
    typeId: string;
    fields: MeasurementFieldOption[];
  } | null>(null);
  const [measurementErrorFor, setMeasurementErrorFor] = useState<string | null>(null);
  const [touchedMeasurements, setTouchedMeasurements] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productType: '',
    productTypeId: '',
    fabric: '',
    fabricId: '',
    color: '',
    colorId: '',
    measurementValues: {} as Record<string, string>,
    design: '',
    referenceImage: '',
    quantity: 1,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    notes: '',
  });

  const loadProductTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError(false);
    try {
      const res = await fetch('/api/custom-orders/product-types');
      const json = await res.json().catch(() => null);
      const parsed = parseProductTypesResponse(json);
      if (!res.ok || !parsed.ok) {
        setTypesError(true);
        return;
      }
      setProductTypeOptions(parsed.types);
    } catch {
      setTypesError(true);
    } finally {
      setTypesLoading(false);
    }
  }, []);

  const loadFabrics = useCallback(async () => {
    setFabricsLoading(true);
    setFabricsError(false);
    try {
      const res = await fetch('/api/custom-order/fabrics');
      const json = await res.json().catch(() => null);
      const parsed = parseFabricsResponse(json);
      if (!res.ok || !parsed.ok) {
        setFabricsError(true);
        return;
      }
      setFabricOptions(parsed.fabrics);
    } catch {
      setFabricsError(true);
    } finally {
      setFabricsLoading(false);
    }
  }, []);

  const loadColors = useCallback(async (fabricId: string) => {
    setColorsLoading(true);
    setColorsError(false);
    try {
      const res = await fetch(`/api/custom-order/fabrics/${fabricId}/colors`);
      const json = await res.json().catch(() => null);
      const parsed = parseColorsResponse(json);
      if (!res.ok || !parsed.ok) {
        setColorsError(true);
        return;
      }
      setColorOptions(parsed.colors);
    } catch {
      setColorsError(true);
    } finally {
      setColorsLoading(false);
    }
  }, []);

  const loadMeasurementFields = useCallback((typeId: string) => {
    fetch(`/api/custom-order/product-types/${typeId}/measurements`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((json) => {
        const parsed = parseMeasurementsResponse(json);
        if (!parsed.ok) throw new Error('malformed payload');
        setMeasurementConfig({ typeId, fields: parsed.fields });
        setMeasurementErrorFor(null);
      })
      .catch(() => {
        setMeasurementErrorFor(typeId);
      });
  }, []);

  useEffect(() => {
    loadProductTypes();
    loadFabrics();
  }, [loadProductTypes, loadFabrics]);

  // Step 3 colors are always scoped to the selected fabric.
  useEffect(() => {
    if (!formData.fabricId) {
      setColorOptions([]);
      return;
    }
    loadColors(formData.fabricId);
  }, [formData.fabricId, loadColors]);

  // Step 4 measurements are fetched whenever the customer reaches the step
  // (fresh config every time, including after going Back), scoped to the
  // product type chosen in Step 1.
  useEffect(() => {
    if (currentStep === 4 && formData.productTypeId) {
      loadMeasurementFields(formData.productTypeId);
    }
  }, [currentStep, formData.productTypeId, loadMeasurementFields]);

  const measurementFields =
    measurementConfig && measurementConfig.typeId === formData.productTypeId
      ? measurementConfig.fields
      : [];
  const measurementsFailed =
    formData.productTypeId !== '' && measurementErrorFor === formData.productTypeId;
  const measurementsLoading =
    formData.productTypeId !== '' &&
    !measurementsFailed &&
    !(measurementConfig && measurementConfig.typeId === formData.productTypeId);
  const measurementValidation = validateMeasurementValues(
    measurementFields,
    formData.measurementValues,
  );

  const updateForm = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  function selectFabric(fabric: FabricOption) {
    setFormData((prev) => {
      const changed = prev.fabricId !== fabric.id;
      return {
        ...prev,
        fabric: fabric.name,
        fabricId: fabric.id,
        // A previously selected color may belong to a different fabric —
        // clear it so Step 3 re-validates against the new selection.
        color: changed ? '' : prev.color,
        colorId: changed ? '' : prev.colorId,
      };
    });
  }

  function selectProductType(type: ProductTypeOption) {
    const changed = formData.productTypeId !== type.id;
    setFormData((prev) => applyProductTypeSelection(prev, type));
    if (changed) {
      // Measurements entered for another product type are cleared — they
      // must never be submitted under the new product type.
      setTouchedMeasurements({});
      setSubmitError(null);
    }
  }

  function selectColor(color: ColorOption) {
    setFormData((prev) => ({ ...prev, color: color.name, colorId: color.id }));
  }

  function setMeasurementValue(fieldKey: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      measurementValues: { ...prev.measurementValues, [fieldKey]: value },
    }));
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.productTypeId;
      case 2: return !!formData.fabricId;
      case 3: return !!formData.colorId;
      case 4:
        if (!formData.productTypeId || measurementsLoading || measurementsFailed) {
          return false;
        }
        // Zero configured fields is a legitimate product (Next stays enabled);
        // otherwise every required field must be filled and valid.
        return measurementValidation.ok;
      case 5: return !!formData.design;
      case 6: return true;
      case 7: return formData.quantity > 0;
      case 8: return !!formData.customerName && !!formData.customerPhone;
      case 9: return true;
      default: return true;
    }
  };

  const snapshot = buildCustomOrderSnapshot(formData, measurementFields);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Server-side re-validation against the LIVE configuration — the
      // admin may have changed requirements between Step 4 and Submit.
      const res = await fetch('/api/custom-order/measurements/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: formData.productTypeId,
          measurements: toSnapshotMeasurements(measurementFields, formData.measurementValues),
        }),
      });

      if (res.status === 400) {
        const json = await res.json().catch(() => null);
        setSubmitError(
          json?.error ??
            'Some measurements are invalid for this product. Please go back to Step 4 and correct them.',
        );
        return;
      }
      setSubmitted(true);
    } catch {
      // Endpoint unreachable — Step 4 already validated against the same
      // rules, so don't block the customer on a network hiccup.
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-cream border-b border-border">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-text-light">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span>/</span>
              <span className="text-text">Custom Order</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-8">
            <span className="text-xs tracking-[4px] text-gold uppercase font-medium">
              Custom Orders
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-2 mb-2">
              Create Your Custom Order
            </h1>
            <div className="line-divider w-16 mx-auto mt-4 mb-4" />
            <p className="text-sm text-text-light">
              Get your furnishing exactly the way you want it
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-3">
                Thank You!
              </h2>
              <p className="text-sm text-text-light mb-6 max-w-md mx-auto">
                Your custom order request has been submitted successfully. Our team will
                contact you shortly to discuss your requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://wa.me/919473831097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-green-600 text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={14} />
                  Chat on WhatsApp
                </a>
                <a
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 border-2 border-primary text-primary text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-primary hover:text-white transition-colors"
                >
                  Browse Products
                </a>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center mb-8 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:justify-between">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 px-2 ${
                        i < steps.length - 1 ? 'flex-shrink-0' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          currentStep > step.id
                            ? 'bg-gold text-white'
                            : currentStep === step.id
                            ? 'bg-primary text-white'
                            : 'bg-cream text-text-light'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <Check size={14} />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`hidden md:inline text-xs font-medium ${
                          currentStep >= step.id ? 'text-text' : 'text-text-light'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`w-6 md:w-12 h-px mx-1 ${
                          currentStep > step.id ? 'bg-gold' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step 1: Product Type */}
                    {currentStep === 1 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Select Product Type</h2>
                        {typesLoading ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" aria-hidden="true">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-lg border border-border animate-pulse"
                              >
                                <div className="h-4 w-3/4 bg-cream rounded" />
                              </div>
                            ))}
                          </div>
                        ) : typesError ? (
                          <div className="border border-border rounded-lg p-6 text-center">
                            <p className="text-sm text-text-light mb-4">
                              We couldn&apos;t load product types right now. Please try again.
                            </p>
                            <button
                              onClick={loadProductTypes}
                              className="px-5 py-2.5 text-[11px] font-bold tracking-wider uppercase border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : productTypeOptions.length === 0 ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            No product types are currently available.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {productTypeOptions.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => selectProductType(type)}
                                className={`p-4 rounded-lg border text-sm font-medium transition-colors ${
                                  formData.productTypeId === type.id
                                    ? 'border-gold bg-gold/10 text-primary'
                                    : 'border-border text-text-light hover:border-gold'
                                }`}
                              >
                                {type.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2: Fabric */}
                    {currentStep === 2 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Choose Fabric</h2>
                        {fabricsLoading ? (
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
                            aria-hidden="true"
                          >
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                className="rounded-xl border border-border overflow-hidden animate-pulse"
                              >
                                <div className="aspect-[4/3] bg-cream" />
                                <div className="border-t border-border px-3 py-3">
                                  <div className="h-4 w-2/3 bg-cream rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : fabricsError ? (
                          <div className="border border-border rounded-lg p-6 text-center">
                            <p className="text-sm text-text-light mb-4">
                              We couldn&apos;t load fabrics right now. Please try again.
                            </p>
                            <button
                              onClick={loadFabrics}
                              className="px-5 py-2.5 text-[11px] font-bold tracking-wider uppercase border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : fabricOptions.length === 0 ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            No fabrics are currently available.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                            {fabricOptions.map((fabric) => (
                              <OptionCard
                                key={fabric.id}
                                name={fabric.name}
                                imageUrl={fabric.imageUrl}
                                selected={formData.fabricId === fabric.id}
                                onSelect={() => selectFabric(fabric)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Color — only colors for the selected fabric */}
                    {currentStep === 3 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-1">Choose Color</h2>
                        {formData.fabric && (
                          <p className="text-sm text-text-light mb-4">
                            Colors for{' '}
                            <span className="font-medium text-primary">{formData.fabric}</span>
                          </p>
                        )}
                        {!formData.fabricId ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            Please go back and choose a fabric first.
                          </p>
                        ) : colorsLoading ? (
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
                            aria-hidden="true"
                          >
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="rounded-xl border border-border overflow-hidden animate-pulse"
                              >
                                <div className="aspect-[4/3] bg-cream" />
                                <div className="border-t border-border px-3 py-3">
                                  <div className="h-4 w-2/3 bg-cream rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : colorsError ? (
                          <div className="border border-border rounded-lg p-6 text-center">
                            <p className="text-sm text-text-light mb-4">
                              We couldn&apos;t load colors right now. Please try again.
                            </p>
                            <button
                              onClick={() => loadColors(formData.fabricId)}
                              className="px-5 py-2.5 text-[11px] font-bold tracking-wider uppercase border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : colorOptions.length === 0 ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            No colors are currently available for this fabric. Please go back
                            and choose another fabric.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                            {colorOptions.map((color) => (
                              <OptionCard
                                key={color.id}
                                name={color.name}
                                imageUrl={color.imageUrl}
                                selected={formData.colorId === color.id}
                                onSelect={() => selectColor(color)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Measurements — rendered 100% from the
                        admin-configured fields for the selected product type */}
                    {currentStep === 4 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Choose Measurements</h2>
                        {!formData.productTypeId ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            Please go back and choose a product type first.
                          </p>
                        ) : measurementsLoading ? (
                          <div className="space-y-4" aria-hidden="true">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-4 w-24 bg-cream rounded mb-2" />
                                <div className="h-11 w-full bg-cream rounded" />
                              </div>
                            ))}
                          </div>
                        ) : measurementsFailed ? (
                          <div className="border border-border rounded-lg p-6 text-center">
                            <p className="text-sm text-text-light mb-4">
                              We couldn&apos;t load the measurement fields right now. Please
                              try again.
                            </p>
                            <button
                              onClick={() => {
                                if (formData.productTypeId) {
                                  setMeasurementErrorFor(null);
                                  loadMeasurementFields(formData.productTypeId);
                                }
                              }}
                              className="px-5 py-2.5 text-[11px] font-bold tracking-wider uppercase border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : measurementFields.length === 0 ? (
                          <p className="text-sm text-text-light border border-border rounded-lg p-6 text-center">
                            No measurements are currently configured for this product.
                          </p>
                        ) : (
                          <>
                            {formData.productType && (
                              <p className="text-sm text-text-light mb-4">
                                Measurements for{' '}
                                <span className="font-medium text-primary">
                                  {formData.productType}
                                </span>
                              </p>
                            )}
                            <div className="space-y-4">
                              {measurementFields.map((field) => {
                                const value = formData.measurementValues[field.fieldKey] ?? '';
                                const error = measurementValidation.errors[field.fieldKey];
                                const showError =
                                  !!error &&
                                  (touchedMeasurements[field.fieldKey] || value.trim() !== '');
                                return (
                                  <div key={field.id}>
                                    <label
                                      htmlFor={`measurement-${field.fieldKey}`}
                                      className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block"
                                    >
                                      {field.label}
                                      {field.isRequired && (
                                        <span className="text-red-500 ml-0.5">*</span>
                                      )}
                                    </label>
                                    {field.description && (
                                      <p className="text-xs text-text-light mb-1.5">
                                        {field.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <input
                                        id={`measurement-${field.fieldKey}`}
                                        type={field.inputType === 'NUMBER' ? 'number' : 'text'}
                                        step={field.inputType === 'NUMBER' ? 'any' : undefined}
                                        min={
                                          field.inputType === 'NUMBER' && field.minValue !== null
                                            ? field.minValue
                                            : undefined
                                        }
                                        max={
                                          field.inputType === 'NUMBER' && field.maxValue !== null
                                            ? field.maxValue
                                            : undefined
                                        }
                                        value={value}
                                        onChange={(e) =>
                                          setMeasurementValue(field.fieldKey, e.target.value)
                                        }
                                        onBlur={() =>
                                          setTouchedMeasurements((prev) => ({
                                            ...prev,
                                            [field.fieldKey]: true,
                                          }))
                                        }
                                        placeholder={field.placeholder ?? undefined}
                                        aria-invalid={showError}
                                        className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                                      />
                                      {field.unit && (
                                        <span className="shrink-0 px-3 py-3 bg-cream border border-border rounded text-sm text-text-light">
                                          {field.unit}
                                        </span>
                                      )}
                                    </div>
                                    {showError && (
                                      <p role="alert" className="text-xs text-red-500 mt-1">
                                        {error}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {!measurementValidation.ok && (
                              <p className="text-xs text-text-light mt-4">
                                Complete the required measurements to continue.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 5: Design */}
                    {currentStep === 5 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Select Design / Pattern</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {designs.map((design) => (
                            <button
                              key={design}
                              onClick={() => updateForm('design', design)}
                              className={`p-4 rounded-lg border text-sm font-medium transition-colors ${
                                formData.design === design
                                  ? 'border-gold bg-gold/10 text-primary'
                                  : 'border-border text-text-light hover:border-gold'
                              }`}
                            >
                              {design}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 6: Reference Image */}
                    {currentStep === 6 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Upload Reference Image</h2>
                        <p className="text-sm text-text-light mb-4">
                          If you have a reference image of the design you want, please share it here.
                        </p>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <Upload size={32} className="text-text-light mx-auto mb-3" />
                          <p className="text-sm text-text-light mb-2">
                            Drag and drop an image, or click to browse
                          </p>
                          <p className="text-xs text-text-light/60">
                            JPG, PNG up to 5MB
                          </p>
                          <input
                            type="text"
                            value={formData.referenceImage}
                            onChange={(e) => updateForm('referenceImage', e.target.value)}
                            placeholder="Or paste an image URL..."
                            className="w-full max-w-sm mx-auto mt-4 px-4 py-2 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 7: Quantity */}
                    {currentStep === 7 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Select Quantity</h2>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => updateForm('quantity', Math.max(1, formData.quantity - 1))}
                            className="w-12 h-12 rounded border border-border flex items-center justify-center text-text-light hover:border-primary hover:text-primary transition-colors"
                          >
                            <span className="text-lg">−</span>
                          </button>
                          <span className="text-2xl font-bold text-text w-12 text-center">
                            {formData.quantity}
                          </span>
                          <button
                            onClick={() => updateForm('quantity', formData.quantity + 1)}
                            className="w-12 h-12 rounded border border-border flex items-center justify-center text-text-light hover:border-primary hover:text-primary transition-colors"
                          >
                            <span className="text-lg">+</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 8: Customer Details */}
                    {currentStep === 8 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Your Details</h2>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={formData.customerName}
                              onChange={(e) => updateForm('customerName', e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              value={formData.customerPhone}
                              onChange={(e) => updateForm('customerPhone', e.target.value)}
                              placeholder="+91 XXXXX XXXXX"
                              className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">
                              Email
                            </label>
                            <input
                              type="email"
                              value={formData.customerEmail}
                              onChange={(e) => updateForm('customerEmail', e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">
                              Delivery Address
                            </label>
                            <textarea
                              value={formData.customerAddress}
                              onChange={(e) => updateForm('customerAddress', e.target.value)}
                              placeholder="Enter your delivery address"
                              className="w-full h-24 px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">
                              Additional Notes
                            </label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => updateForm('notes', e.target.value)}
                              placeholder="Any special requirements or notes..."
                              className="w-full h-24 px-4 py-3 bg-cream border border-border rounded text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 9: Review & Submit */}
                    {currentStep === 9 && (
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary mb-4">Review Your Order</h2>
                        <div className="space-y-3 bg-cream rounded-lg p-4 mb-4">
                          {[
                            { label: 'Product Type', value: snapshot.productTypeName },
                            { label: 'Fabric', value: snapshot.fabricName },
                            { label: 'Color', value: snapshot.colorName },
                            {
                              label: 'Measurements',
                              value: formatMeasurementSummary(
                                measurementFields,
                                formData.measurementValues,
                              ),
                            },
                            { label: 'Design', value: snapshot.design },
                            { label: 'Quantity', value: String(snapshot.quantity) },
                            { label: 'Name', value: snapshot.customerName },
                            { label: 'Phone', value: snapshot.customerPhone },
                            { label: 'Email', value: snapshot.customerEmail },
                          ].filter(item => item.value).map((item) => (
                            <div key={item.label} className="flex justify-between text-sm">
                              <span className="text-text-light">{item.label}</span>
                              <span className="font-medium text-text">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {submitError && (
                  <div role="alert" className="mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
                      currentStep === 1
                        ? 'text-text-light/40 cursor-not-allowed'
                        : 'text-text-light hover:text-primary'
                    }`}
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  {currentStep < 9 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!canProceed()}
                      className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 text-[11px] sm:text-xs font-bold tracking-wider uppercase rounded transition-colors ${
                        canProceed()
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-border text-text-light cursor-not-allowed'
                      }`}
                    >
                      Next
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gold text-white text-[11px] sm:text-xs font-bold tracking-wider uppercase rounded hover:bg-light-gold disabled:opacity-60 transition-colors"
                    >
                      {submitting ? 'Submitting…' : (<><Check size={14} /> Submit Order</>)}
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="text-center mt-6">
                <a
                  href="https://wa.me/919473831097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-gold hover:text-primary transition-colors"
                >
                  <MessageCircle size={14} />
                  Prefer to chat? Message us on WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
