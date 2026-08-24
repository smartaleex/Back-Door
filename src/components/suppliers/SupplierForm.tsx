import Link from "next/link";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";
import { CustomFieldsFieldset } from "@/components/CustomFieldsFieldset";
import { CustomFieldType } from "@/generated/prisma/client";

type Def = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options: unknown;
  isRequired: boolean;
};

export interface SupplierFormValues {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  attributes: unknown;
}

export function SupplierForm({
  action,
  initial,
  customFieldDefs,
}: {
  action: (formData: FormData) => void;
  initial?: SupplierFormValues;
  customFieldDefs: Def[];
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Supplier name</label>
          <input name="name" defaultValue={initial?.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact name</label>
          <input name="contactName" defaultValue={initial?.contactName ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" defaultValue={initial?.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" defaultValue={initial?.phone ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input name="website" defaultValue={initial?.website ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea name="notes" defaultValue={initial?.notes ?? ""} rows={3} className={inputClass} />
        </div>
      </div>

      <CustomFieldsFieldset defs={customFieldDefs} attributes={initial?.attributes} />

      <div className="flex gap-3">
        <button type="submit" className={buttonClass}>
          Save supplier
        </button>
        <Link href="/suppliers" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
