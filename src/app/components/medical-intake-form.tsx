import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface MedicalIntakeSubmitResult {
  downloadUrl?: string;
  fileName?: string;
}

interface MedicalIntakeFormProps {
  patientId?: string;
  initialData?: Partial<MedicalIntakeData>;
  onSubmit?: (
    data: MedicalIntakeData,
  ) => Promise<MedicalIntakeSubmitResult | void>;
  onCancel?: () => void;
}

export interface FamilyDetailRow {
  name: string;
  date_of_birth: string;
  allergies: string;
  other: string;
}

export interface MedicalIntakeData {
  account_number: string;

  patient_surname: string;
  patient_first_name: string;
  patient_date_of_birth: string;
  patient_id_number: string;
  patient_occupation: string;
  patient_home_language: string;
  patient_marital_status: string;
  patient_tel_home: string;
  patient_tel_business: string;
  patient_cell: string;
  patient_email: string;

  responsible_surname: string;
  responsible_first_name: string;
  responsible_id_number: string;
  responsible_home_address: string;
  responsible_home_code: string;
  responsible_postal_address: string;
  responsible_postal_code: string;
  responsible_employer: string;
  responsible_work_address: string;
  responsible_work_code: string;
  responsible_tel_home: string;
  responsible_tel_business: string;
  responsible_cell: string;
  responsible_email: string;

  medical_aid_name: string;
  medical_aid_number: string;
  medical_aid_member_name: string;
  medical_aid_id_number: string;
  medical_aid_tel_home: string;
  medical_aid_tel_business: string;
  medical_aid_cell: string;

  nearest_name: string;
  nearest_relationship: string;
  nearest_address: string;
  nearest_code: string;
  nearest_tel_home: string;
  nearest_tel_business: string;
  nearest_cell: string;

  referred_by_name: string;
  referred_by_tel: string;

  patient_signature: string;
  signature_date: string;

  family_details: FamilyDetailRow[];
}

const emptyFamilyRow = (): FamilyDetailRow => ({
  name: "",
  date_of_birth: "",
  allergies: "",
  other: "",
});

const initialState: MedicalIntakeData = {
  account_number: "",

  patient_surname: "",
  patient_first_name: "",
  patient_date_of_birth: "",
  patient_id_number: "",
  patient_occupation: "",
  patient_home_language: "",
  patient_marital_status: "",
  patient_tel_home: "",
  patient_tel_business: "",
  patient_cell: "",
  patient_email: "",

  responsible_surname: "",
  responsible_first_name: "",
  responsible_id_number: "",
  responsible_home_address: "",
  responsible_home_code: "",
  responsible_postal_address: "",
  responsible_postal_code: "",
  responsible_employer: "",
  responsible_work_address: "",
  responsible_work_code: "",
  responsible_tel_home: "",
  responsible_tel_business: "",
  responsible_cell: "",
  responsible_email: "",

  medical_aid_name: "",
  medical_aid_number: "",
  medical_aid_member_name: "",
  medical_aid_id_number: "",
  medical_aid_tel_home: "",
  medical_aid_tel_business: "",
  medical_aid_cell: "",

  nearest_name: "",
  nearest_relationship: "",
  nearest_address: "",
  nearest_code: "",
  nearest_tel_home: "",
  nearest_tel_business: "",
  nearest_cell: "",

  referred_by_name: "",
  referred_by_tel: "",

  patient_signature: "",
  signature_date: "",

  family_details: [emptyFamilyRow()],
};

const createFormState = (
  initialData?: Partial<MedicalIntakeData>,
): MedicalIntakeData => ({
  ...initialState,
  ...initialData,
  family_details:
    initialData?.family_details && initialData.family_details.length > 0
      ? initialData.family_details
      : initialState.family_details,
});

const MedicalIntakeForm: React.FC<MedicalIntakeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [formData, setFormData] = useState<MedicalIntakeData>(() =>
    createFormState(initialData),
  );

  useEffect(() => {
    setFormData(createFormState(initialData));
    setConsentAccepted(false);
  }, [initialData]);

  const label = useMemo(
    () => ({
      title: "MEDICAL FILE / MEDIESE LEER",
      account: "Account Number / Rekening Nommer",
      required: "* Required / Vereis",

      patient: "PATIENT DETAILS / PASIENT BESONDERHEDE",
      responsible:
        "PERSON RESPONSIBLE FOR ACCOUNT / PERSOON VERANTWOORDELIK VIR REKENING",
      aid: "MEDICAL AID / MEDIESE HULP",
      nearest: "NEAREST FAMILY/FRIEND / NAASTE FAMILIE/VRIEND",
      referred: "REFERRED BY / VERWYS DEUR",
      family: "FAMILY DETAILS / FAMILIE BESONDERHEDE",
      signature: "SIGNATURE / HANDTEKENING",
    }),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFamilyChange = (
    index: number,
    field: keyof FamilyDetailRow,
    value: string,
  ) => {
    setFormData((prev) => {
      const rows = [...prev.family_details];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, family_details: rows };
    });
  };

  const addFamilyRow = () => {
    setFormData((prev) => ({
      ...prev,
      family_details: [...prev.family_details, emptyFamilyRow()],
    }));
  };

  const removeFamilyRow = (index: number) => {
    setFormData((prev) => {
      if (prev.family_details.length === 1) {
        return prev;
      }
      return {
        ...prev,
        family_details: prev.family_details.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentAccepted) {
      toast.error("Please accept the disclosure before submitting");
      return;
    }

    const missingFields: string[] = [];
    if (!formData.patient_surname) missingFields.push("patient surname");
    if (!formData.patient_first_name) missingFields.push("patient first name");
    if (!formData.patient_cell) missingFields.push("patient cell number");
    if (!formData.patient_date_of_birth) missingFields.push("date of birth");
    if (!formData.patient_id_number) missingFields.push("ID number");
    if (!formData.nearest_name) missingFields.push("nearest contact name");
    if (!formData.nearest_cell) missingFields.push("nearest contact cell");
    if (!formData.patient_signature) missingFields.push("patient signature");
    if (!formData.signature_date) missingFields.push("signature date");

    if (missingFields.length > 0) {
      toast.error(
        `Please complete required fields: ${missingFields.slice(0, 4).join(", ")}${missingFields.length > 4 ? "..." : ""}`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit(formData);
      }
      toast.success("Medical file submitted successfully");
    } catch (error) {
      console.error("Medical intake submission failed:", error);
      toast.error("Failed to submit medical file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl">
                {label.title}
              </CardTitle>
              <CardDescription>{label.required}</CardDescription>
            </div>
            <div className="w-full md:w-72">
              <Label htmlFor="account_number">{label.account}</Label>
              <Input
                id="account_number"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.patient}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field
                  name="patient_surname"
                  text="Surname / Van"
                  value={formData.patient_surname}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="patient_first_name"
                  text="First Name / Voornaam"
                  value={formData.patient_first_name}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="patient_date_of_birth"
                  text="Date of Birth / Geboortedatum"
                  type="date"
                  value={formData.patient_date_of_birth}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="patient_id_number"
                  text="I.D Number / I.D Nommer"
                  value={formData.patient_id_number}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="patient_occupation"
                  text="Occupation / Beroep"
                  value={formData.patient_occupation}
                  onChange={handleChange}
                />
                <Field
                  name="patient_home_language"
                  text="Home Language / Huistaal"
                  value={formData.patient_home_language}
                  onChange={handleChange}
                />
                <Field
                  name="patient_marital_status"
                  text="Marital Status / Huwelikstatus"
                  value={formData.patient_marital_status}
                  onChange={handleChange}
                />
                <Field
                  name="patient_tel_home"
                  text="Tel. (H)"
                  value={formData.patient_tel_home}
                  onChange={handleChange}
                />
                <Field
                  name="patient_tel_business"
                  text="Tel. (B)"
                  value={formData.patient_tel_business}
                  onChange={handleChange}
                />
                <Field
                  name="patient_cell"
                  text="Cell / Selfoon"
                  value={formData.patient_cell}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="patient_email"
                  text="E-Mail / E-pos"
                  type="email"
                  value={formData.patient_email}
                  onChange={handleChange}
                  className="lg:col-span-2"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.responsible}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field
                  name="responsible_surname"
                  text="Surname / Van"
                  value={formData.responsible_surname}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_first_name"
                  text="First Name / Voornaam"
                  value={formData.responsible_first_name}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_id_number"
                  text="I.D Number / I.D Nommer"
                  value={formData.responsible_id_number}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_home_address"
                  text="Home Address / Huisadres"
                  value={formData.responsible_home_address}
                  onChange={handleChange}
                  className="lg:col-span-2"
                />
                <Field
                  name="responsible_home_code"
                  text="Code / Poskode"
                  value={formData.responsible_home_code}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_postal_address"
                  text="Postal Address / Posadres"
                  value={formData.responsible_postal_address}
                  onChange={handleChange}
                  className="lg:col-span-2"
                />
                <Field
                  name="responsible_postal_code"
                  text="Code / Poskode"
                  value={formData.responsible_postal_code}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_employer"
                  text="Employer / Werkgewer"
                  value={formData.responsible_employer}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_work_address"
                  text="Work Address / Werkadres"
                  value={formData.responsible_work_address}
                  onChange={handleChange}
                  className="lg:col-span-2"
                />
                <Field
                  name="responsible_work_code"
                  text="Code / Poskode"
                  value={formData.responsible_work_code}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_tel_home"
                  text="Tel. (H)"
                  value={formData.responsible_tel_home}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_tel_business"
                  text="Tel. (B)"
                  value={formData.responsible_tel_business}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_cell"
                  text="Cell / Selfoon"
                  value={formData.responsible_cell}
                  onChange={handleChange}
                />
                <Field
                  name="responsible_email"
                  text="E-Mail / E-pos"
                  type="email"
                  value={formData.responsible_email}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.aid}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field
                  name="medical_aid_name"
                  text="Name / Naam"
                  value={formData.medical_aid_name}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_number"
                  text="Number / Nommer"
                  value={formData.medical_aid_number}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_member_name"
                  text="Member's Name / Lid se Naam"
                  value={formData.medical_aid_member_name}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_id_number"
                  text="I.D Number / I.D Nommer"
                  value={formData.medical_aid_id_number}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_tel_home"
                  text="Tel. (H)"
                  value={formData.medical_aid_tel_home}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_tel_business"
                  text="Tel. (B)"
                  value={formData.medical_aid_tel_business}
                  onChange={handleChange}
                />
                <Field
                  name="medical_aid_cell"
                  text="Cell / Selfoon"
                  value={formData.medical_aid_cell}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.nearest}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field
                  name="nearest_name"
                  text="Name / Naam"
                  value={formData.nearest_name}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="nearest_relationship"
                  text="Relationship / Verhouding"
                  value={formData.nearest_relationship}
                  onChange={handleChange}
                />
                <Field
                  name="nearest_address"
                  text="Address / Adres"
                  value={formData.nearest_address}
                  onChange={handleChange}
                  className="lg:col-span-2"
                />
                <Field
                  name="nearest_code"
                  text="Code / Poskode"
                  value={formData.nearest_code}
                  onChange={handleChange}
                />
                <Field
                  name="nearest_tel_home"
                  text="Tel. (H)"
                  value={formData.nearest_tel_home}
                  onChange={handleChange}
                />
                <Field
                  name="nearest_tel_business"
                  text="Tel. (B)"
                  value={formData.nearest_tel_business}
                  onChange={handleChange}
                />
                <Field
                  name="nearest_cell"
                  text="Cell / Selfoon"
                  value={formData.nearest_cell}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.referred}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  name="referred_by_name"
                  text="Name / Naam"
                  value={formData.referred_by_name}
                  onChange={handleChange}
                />
                <Field
                  name="referred_by_tel"
                  text="Tel."
                  value={formData.referred_by_tel}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.family}
              </h3>
              <div className="space-y-3">
                {formData.family_details.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field
                        name={`family_name_${index}`}
                        text="Name / Naam"
                        value={row.name}
                        onChange={(e) =>
                          handleFamilyChange(index, "name", e.target.value)
                        }
                      />
                      <Field
                        name={`family_dob_${index}`}
                        text="Date of Birth / Geboortedatum"
                        type="date"
                        value={row.date_of_birth}
                        onChange={(e) =>
                          handleFamilyChange(
                            index,
                            "date_of_birth",
                            e.target.value,
                          )
                        }
                      />
                      <Field
                        name={`family_allergies_${index}`}
                        text="Allergies / Allergiee"
                        value={row.allergies}
                        onChange={(e) =>
                          handleFamilyChange(index, "allergies", e.target.value)
                        }
                      />
                      <Field
                        name={`family_other_${index}`}
                        text="Other / Ander"
                        value={row.other}
                        onChange={(e) =>
                          handleFamilyChange(index, "other", e.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeFamilyRow(index)}
                        disabled={formData.family_details.length === 1}
                      >
                        Remove Row
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFamilyRow}>
                  Add Family Row
                </Button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">
                {label.signature}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  name="patient_signature"
                  text="Patient Signature (Type full name) / Pasient Handtekening"
                  value={formData.patient_signature}
                  onChange={handleChange}
                  required
                />
                <Field
                  name="signature_date"
                  text="Date / Datum"
                  type="date"
                  value={formData.signature_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <input
                  id="medical-disclosure"
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => setConsentAccepted(event.target.checked)}
                  className="mt-1"
                />
                <Label
                  htmlFor="medical-disclosure"
                  className="text-sm leading-5"
                >
                  I confirm that the information provided is accurate, and I
                  consent to DentalX storing and using this information for
                  treatment, billing, and record-keeping purposes.
                </Label>
              </div>
            </section>

            <div className="pt-4 border-t flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit / Dien In"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel / Kanselleer
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

type FieldProps = {
  name: string;
  text: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  required?: boolean;
};

function Field({
  name,
  text,
  value,
  onChange,
  type = "text",
  className,
  required = false,
}: FieldProps) {
  return (
    <div className={className}>
      <div className="space-y-1.5">
        <Label htmlFor={name}>
          {text}
          {required ? <span className="text-red-500">*</span> : null}
        </Label>
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
    </div>
  );
}

export default MedicalIntakeForm;
