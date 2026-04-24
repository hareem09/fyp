import { useState } from "react";
import axios from 'axios'
function CreateInvite() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [batch, setBatch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === "name") {
      setName(e.target.value);
    } else if (e.target.name === "email") {
      setEmail(e.target.value);
    }else if(e.target.name === "department"){
      setDepartment(e.target.value)
    } else if(e.target.name === "semester"){
      setSemester(e.target.value)
    } else if(e.target.name === "batch"){
      setBatch(e.target.value)
    } 
    else if (e.target.name === "roll no") {
      setRollNo(e.target.value);
  };
}
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/admin/invite-student",
        { name, email, rollNo,department,semester,batch},
        { withCredentials: true },
      );
      console.log(res.data);
      setSuccess(true);
      setMessage(res.data.message);
      setError(""); 
      // alert("Invite created successfully!");
  
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message);
      setMessage("");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
    <main>
      <h1>Create Invite</h1>
      <div className=" w-200 min-h-1vh flex items-center justify-center p-10">
        <form onSubmit={handleSubmit} className=' flex flex-wrap gap-10'>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block mb-2"
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
              className="block text-gray-700  mb-2"
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
              className="block text-grey-900  mb-2"
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
              className="block text-gray-700 mb-2"
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
              placeholder="Department"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="semester"
              className="block text-gray-700 mb-2"
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
              placeholder="Semester"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="batch"
              className="block text-gray-700 mb-2"
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
              placeholder="Batch"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 self-end mt-6 text-white font-bold h-10 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? "Sending invite..." : "SEND INVITE"}
          </button>
          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}
        </form>
      </div>
      </main>
    </>
  );
}

export default CreateInvite;
