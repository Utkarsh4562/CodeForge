import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { useForm } from "react-hook-form";

const UpdateProblem = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const tagsValue = watch("tags", "");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/problem/all");
      setProblems(data || []);
    } catch (err) {
      setError("Failed to fetch problems");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (problem) => {
    setSelectedProblem(problem);
    // Populate form with problem data
    setValue("title", problem.title);
    setValue("description", problem.description);
    setValue("difficulty", problem.difficulty);
    setValue("tags", Array.isArray(problem.tags) ? problem.tags.join(", ") : problem.tags);
    setValue("visibleTestCases", JSON.stringify(problem.visibleTestCases || []));
    setValue("hiddenTestCases", JSON.stringify(problem.hiddenTestCases || []));
    setValue("startCode", JSON.stringify(problem.startCode || []));
    setValue("refrenceSolution", problem.refrenceSolution || "");
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsModalOpen(false);
    setSelectedProblem(null);
    reset();
    setSuccessMessage(null);
  };

  const onSubmit = async (formData) => {
    if (!selectedProblem) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // Parse JSON fields
      let processedData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      try {
        processedData.visibleTestCases = JSON.parse(formData.visibleTestCases);
      } catch {
        setError("Invalid JSON format for visibleTestCases");
        return;
      }

      try {
        processedData.hiddenTestCases = JSON.parse(formData.hiddenTestCases);
      } catch {
        setError("Invalid JSON format for hiddenTestCases");
        return;
      }

      try {
        processedData.startCode = JSON.parse(formData.startCode);
      } catch {
        setError("Invalid JSON format for startCode");
        return;
      }

      // Send update request
      await axiosClient.put(`/problem/update/${selectedProblem._id}`, processedData);

      setSuccessMessage(`Problem "${formData.title}" updated successfully!`);

      // Update local state
      setProblems((prev) =>
        prev.map((p) =>
          p._id === selectedProblem._id
            ? { ...p, ...processedData }
            : p
        )
      );

      // Close modal after 2 seconds
      setTimeout(() => {
        closeUpdateModal();
      }, 2000);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.error || "Failed to update problem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !isModalOpen) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M12 2a10 10 0 100 20 10 10 0 000-20z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Update Problems</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-4/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-3/12">Tags</th>
              <th className="w-2/12">Actions</th>
            </tr>
          </thead>

          <tbody>
            {problems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>

                <td>{problem.title}</td>

                <td>
                  <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {problem.difficulty}
                  </span>
                </td>

                <td>
                  {Array.isArray(problem.tags) ? (
                    problem.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="badge mr-1 bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="badge bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      {problem.tags}
                    </span>
                  )}
                </td>

                <td>
                  <button
                    onClick={() => openUpdateModal(problem)}
                    className="btn btn-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/40"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Update Problem</h3>

            {successMessage && (
              <div className="alert alert-success mb-4">
                <span>{successMessage}</span>
              </div>
            )}

            {error && isModalOpen && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Problem title"
                  {...register("title", { required: "Title is required" })}
                  className="input input-bordered w-full"
                />
                {errors.title && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.title.message}</span>
                  </label>
                )}
              </div>

              {/* Description */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Problem description"
                  {...register("description", { required: "Description is required" })}
                  className="textarea textarea-bordered w-full h-24"
                ></textarea>
                {errors.description && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.description.message}</span>
                  </label>
                )}
              </div>

              {/* Difficulty */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Difficulty</span>
                </label>
                <select
                  {...register("difficulty", { required: "Difficulty is required" })}
                  className="select select-bordered w-full"
                >
                  <option value="">Select difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                {errors.difficulty && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.difficulty.message}</span>
                  </label>
                )}
              </div>

              {/* Tags */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Tags (comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., array, string, dynamic-programming"
                  {...register("tags", { required: "At least one tag is required" })}
                  className="input input-bordered w-full"
                />
                {errors.tags && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.tags.message}</span>
                  </label>
                )}
              </div>

              {/* Visible Test Cases */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Visible Test Cases (JSON)</span>
                </label>
                <textarea
                  placeholder='[{"input": "...", "output": "..."}]'
                  {...register("visibleTestCases")}
                  className="textarea textarea-bordered w-full h-20 font-mono text-sm"
                ></textarea>
                {errors.visibleTestCases && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.visibleTestCases.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Hidden Test Cases */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Hidden Test Cases (JSON)</span>
                </label>
                <textarea
                  placeholder='[{"input": "...", "output": "..."}]'
                  {...register("hiddenTestCases")}
                  className="textarea textarea-bordered w-full h-20 font-mono text-sm"
                ></textarea>
                {errors.hiddenTestCases && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.hiddenTestCases.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Start Code */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Start Code (JSON)</span>
                </label>
                <textarea
                  placeholder='[{"language": "javascript", "initialCode": "..."}]'
                  {...register("startCode")}
                  className="textarea textarea-bordered w-full h-20 font-mono text-sm"
                ></textarea>
                {errors.startCode && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.startCode.message}</span>
                  </label>
                )}
              </div>

              {/* Reference Solution */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Reference Solution</span>
                </label>
                <textarea
                  placeholder="Optimal solution code"
                  {...register("refrenceSolution")}
                  className="textarea textarea-bordered w-full h-20"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProblem;
