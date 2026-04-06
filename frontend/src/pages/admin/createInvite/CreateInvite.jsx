import { useState } from "react";

function CreateInvite() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [batch, setBatch] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    if (e.target.name === "name") {
      setName(e.target.value);
    } else if (e.target.name === "email") {
      setEmail(e.target.value);
    } else if (e.target.name === "roll no") {
      setRollNo(e.target.value);
    } else if (e.target.name === "password") {
      setPassword(e.target.value);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/admin/invite-student",
        { name, email, rollNo, password },
        { withCredentials: true },
      );
      console.log(res.data);
      setSuccess(true);
      alert("Invite created successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <h1>Create Invite</h1>
      <div className="bg-gray-100 h-screen w-60 flex items-center justify-center">
        <form onSubmit={handleSubmit} className='flew-wrap'>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Name
            </label>
            <input
              type="name"
              id="name"
              name="name"
              value={name}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="full name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="name@company.com"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="roll no"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Roll Number
            </label>
            <input
              type="number"
              id="roll NO"
              name="roll no"
              value={rollNo}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="roll no"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="department"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Department
            </label>
            <input
              type="name"
              id="department"
              name="department"
              value={department}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="full name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="semester"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Semester
            </label>
            <input
              type="name"
              id="semester"
              name="semester"
              value={semester}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="full name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="batch"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
              Batch
            </label>
            <input
              type="name"
              id="batch"
              name="batch"
              value={batch}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400 dark:text-white"
              placeholder="full name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 dark:text-white/60 mb-2"
            >
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
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700  text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? "Sending invite..." : "SEND INVITE"}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateInvite;
