import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
function studentLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
 
 const handleChange = (e) => {
        if (e.target.name === 'email') {
            setEmail(e.target.value);
        } else if (e.target.name === 'password') {
            setPassword(e.target.value);
        }
    }
  const handleSubmit = async (e) =>{
     e.preventDefault();
     setLoading(true);
     setError(null);
     setSuccess(false);
     try{
      const res = await axios.post('http://localhost:3000/api/auth/login/student', { email, password }, { withCredentials: true });
      console.log(res.data);
       localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setSuccess(true);
      alert('Login successful!');
      navigate('/student/dashboard');
      }catch(err){
        console.error(err);
        setError("Invalid email or password");
      } finally {
        setLoading(false);
      }
  }
  return (
    <>
    <h1>StudentLogin</h1>
    <div className='bg-gray-100 h-screen flex items-center justify-center'>
      <form action="/login" method="POST" className='border-2  border-violet-300 p-9 rounded-2xl' onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 dark:text-white/60 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 dark:text-white/60 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
    </>
  )
}

export default studentLogin