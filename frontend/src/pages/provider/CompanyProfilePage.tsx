import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { providerApi } from '@/api/provider';
import toast from 'react-hot-toast';
import { Building2, Globe, MapPin, Users, Shield, Upload } from 'lucide-react';
import type { Company } from '@/types';

const schema = z.object({
  name:        z.string().min(1, 'Company name is required').max(200),
  description: z.string().optional(),
  industry:    z.string().max(100).optional(),
  size:        z.string().max(50).optional(),
  website:     z.string().url('Enter a valid URL').optional().or(z.literal('')),
  location:    z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing',
  'Media', 'Consulting', 'Real Estate', 'Logistics', 'Other',
];

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: company, isLoading } = useQuery<Company | null>({
    queryKey: ['my-company'],
    queryFn: async () => {
      try {
        const res = await providerApi.getCompany();
        return res.data.data;
      } catch {
        setIsNew(true);
        return null;
      }
    },
  });

  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (company) {
      reset({
        name:        company.name,
        description: company.description ?? '',
        industry:    company.industry ?? '',
        size:        company.size ?? '',
        website:     company.website ?? '',
        location:    company.location ?? '',
      });
      if (company.logoUrl) setLogoPreview(company.logoUrl);
      setIsNew(false);
    }
  }, [company, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isNew) {
        return providerApi.createCompany({ ...values, website: values.website || undefined });
      }
      return providerApi.updateCompany({ ...values, website: values.website || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
      toast.success(isNew ? 'Company profile created!' : 'Company profile updated!');
      setIsNew(false);
    },
    onError: () => toast.error('Failed to save company profile'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => providerApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      toast.success('Logo uploaded!');
    },
    onError: () => toast.error('Logo upload failed'),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = () => {
    if (logoFile) logoMutation.mutate(logoFile);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={24} className="text-brand-600" />
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-500 text-sm">
            {isNew ? 'Create your company profile to start posting jobs.' : 'Update your company information.'}
          </p>
        </div>
        {company?.isVerified && (
          <span className="ml-auto flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            <Shield size={12} /> Verified
          </span>
        )}
      </div>

      {/* Logo section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Company Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={32} className="text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-brand-300 hover:bg-brand-50 transition-colors">
              <Upload size={14} />
              Choose logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
            {logoFile && (
              <button
                onClick={handleLogoUpload}
                disabled={logoMutation.isPending || isNew}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {logoMutation.isPending ? 'Uploading…' : 'Upload Logo'}
              </button>
            )}
            {isNew && (
              <p className="text-xs text-amber-600">Save your company profile first, then upload a logo.</p>
            )}
          </div>
        </div>
      </div>

      {/* Company details form */}
      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800">Company Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Acme Corporation"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About the Company</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Describe your company, culture, and mission…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users size={13} className="inline mr-1" />Industry
              </label>
              <select
                {...register('industry')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select
                {...register('size')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe size={13} className="inline mr-1" />Website
              </label>
              <input
                {...register('website')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="https://yourcompany.com"
              />
              {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={13} className="inline mr-1" />Location
              </label>
              <input
                {...register('location')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="e.g. Bangalore, India"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending || (!isDirty && !isNew)}
              className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending
                ? 'Saving…'
                : isNew
                  ? 'Create Company Profile'
                  : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
