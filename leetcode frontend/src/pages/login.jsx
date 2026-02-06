import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loginUser } from '../authSlice';

const loginSchema = z.object({
  emailId: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false); // ✅ missing state

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">

            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-base-content">Login</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Access your account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <input
                  {...register('emailId')}
                  type="email"
                  placeholder="you@example.com"
                  className={`input input-bordered w-full ${
                    errors.emailId ? 'input-error' : ''
                  }`}
                />
                {errors.emailId && (
                  <span className="text-error text-sm">
                    {errors.emailId.message}
                  </span>
                )}
              </div>
     <div className="form-control relative">
     <label className="label">
     <span className="label-text font-medium">Password</span>
  </label>

   <div className="relative">
    <input
      {...register('password')}
      type={showPassword ? 'text' : 'password'}
      placeholder="••••••••"
      className={`input input-bordered w-full pr-12 ${
        errors.password ? 'input-error' : ''
      }`}
    />

    {/* Eye Icon Button */}
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
    >
      {showPassword ? (
        // Eye Off
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M17.94 17.94C16.23 19.02 14.22 19.7 12 19.7c-6.5 0-10-7-10-7a20.9 20.9 0 0 1 5.06-5.94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 12s-3.5 7-10 7c-.73 0-1.44-.07-2.12-.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        // Eye
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" strokeWidth="2"/>
        </svg>
      )}
    </button>
  </div>

  {errors.password && (
    <span className="text-error text-sm">
      {errors.password.message}
    </span>
  )}
</div>


  <button type="submit" className="btn btn-primary w-full mt-4">
    Login
   </button>
      </form>

   <div className="divider text-sm text-base-content/60">OR</div>

      <p className="text-center text-sm text-base-content/60">
         Don’t have an account?{' '}
         <a href="/signup" className="link link-primary font-semibold">
         Sign up
         </a>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
