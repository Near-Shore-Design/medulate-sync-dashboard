import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  validateCode,
  registerAccount,
  type ValidateCodeDepartment,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

const UNITS = [
  { value: 'anesthesia', label: 'Anesthesia' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'internal_medicine', label: 'Internal Medicine' },
  { value: 'app', label: 'Advanced Practice Providers' },
];

type Step = 'code' | 'details' | 'done';

interface Institution {
  id: number;
  name: string;
  slug: string;
}

const SignupPage = () => {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [departments, setDepartments] = useState<ValidateCodeDepartment[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unit, setUnit] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = useCallback(async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setError('Please enter your registration code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await validateCode(trimmed);
      if (!result.valid || !result.institution) {
        setError(result.detail || 'Invalid registration code.');
        return;
      }
      setInstitution(result.institution);
      const depts = result.departments ?? [];
      setDepartments(depts);
      if (depts.length > 0) setDepartmentId(String(depts[0].id));
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Could not validate code.');
    } finally {
      setLoading(false);
    }
  }, []);

  // If the emailed link carries ?code=XXXX, prefill and auto-validate.
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleValidate(urlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    if (departments.length === 0) {
      setError('This institution is not ready for signups yet. Please contact your administrator.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerAccount({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        registration_code: code,
        department_id: Number(departmentId),
        unit,
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              {step === 'done' ? (
                <CheckCircle2 className="h-7 w-7 text-primary" />
              ) : (
                <UserPlus className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join SOPHIA Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 'code' && 'Enter your registration code to get started'}
            {step === 'details' && institution && `Creating your account for ${institution.name}`}
            {step === 'done' && 'Your account is ready'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 'code' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidate(code);
            }}
            className="rounded-xl bg-card p-6 shadow-card space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Registration code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CARILION1"
                autoComplete="off"
                className="text-sm tracking-widest uppercase"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleRegister} className="rounded-xl bg-card p-6 shadow-card space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.org"
                autoComplete="email"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                autoComplete="new-password"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Unit</label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select your unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {departments.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Department</label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || !fullName.trim() || !email.trim() || !password || !unit || !departmentId
              }
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="rounded-xl bg-card p-6 shadow-card space-y-3 text-center">
            <p className="text-sm text-foreground">
              Your account has been created{institution ? ` for ${institution.name}` : ''}.
            </p>
            <p className="text-sm text-muted-foreground">
              Open the DHRT training application and sign in with your email and password to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
