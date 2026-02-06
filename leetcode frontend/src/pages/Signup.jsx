import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { registerUser } from '../authSlice';

// schema validation for signup form
const signupSchema = z.object({
  firstName: z.string().min(3, "Name should contain at least 3 characters"),
  emailId: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(8, "Password should contain at least 8 characters"),
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated , loading} = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-base-content mb-2">Create Account</h1>
            <p className="text-base-content/60">Join us and start solving problems</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First Name Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <input
                {...register('firstName')}
                type="text"
                placeholder="Enter your full name"
                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
              />
              {errors.firstName && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.firstName.message}</span>
                </label>
              )}
            </div>

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <input
                {...register('emailId')}
                type="email"
                placeholder="Enter your email"
                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`}
              />
              {errors.emailId && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.emailId.message}</span>
                </label>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control relative">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password (min 8 characters)"
                className={`input input-bordered w-full pr-12 ${errors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-10 text-base-content/70 hover:text-base-content"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.94 17.94C16.23 19.02 14.22 19.7 12 19.7c-6.5 0-10-7-10-7a20.9 20.9 0 0 1 5.06-5.94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 12s-3.5 7-10 7c-.73 0-1.44-.07-2.12-.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  </svg>
                )}
              </button>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`"btn btn-primary w-full font-semibold mt-6 ${loading ? 'loading' : ''}`}
              disabled = {loading}
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-base-content/60">
            <p>
              Already have an account?{' '}
              <a href="/login" className="link link-primary font-semibold">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;


// import {useEffect,useState} from 'react';




// function Signup(){

//     const [name,setName] = useState('');
//     const [email,setEmail] = useState('');
//     const [password,setPassword] = useState(''); 

//     const  handleSubmit =(e)=>{ // e is event object that is passed to event handlers 

//       e.preventDefault(); // to prevent the default behaviour of form submission which is to reload the page 
//       console.log(name,email,password);


//       // validation karenge sign up ke liye 

      
//       // form ko submit kar dunga 
//       // backend ko submit ho form 
//     }

//     return(
//        <form onSubmit={handleSubmit} className="min-h-screen flex flex-col justify-center items-center gap-y-3">
//      <input type="text" value={name} placeholder="Enter your firstname" onChange={(e)=>setName(e.target.value)}></input>
//      <input type="email" value={email} placeholder="Enter your Email" onChange={(e)=>setEmail(e.target.value)}></input>
//      <input type="password" value={password} placeholder="Enter your Password" onChange={(e)=>setPassword(e.target.value)}></input>
//      <button type="submit">Submit</button>
//        </form>
//     )
// }