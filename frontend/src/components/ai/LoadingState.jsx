import LoadingSpinner from "../common/LoadingSpinner.jsx";

export default function LoadingState({ label = "Loading AI assistant..." }) {
  return (
    <div className="card p-5">
      <LoadingSpinner label={label} />
    </div>
  );
}
