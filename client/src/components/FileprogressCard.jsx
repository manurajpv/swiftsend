function FileProgressCard(props) {
  return (
    <div className="bg-white shadow-md rounded-md p-4 mb-4">
      <div className="text-lg font-semibold">{props.filename}</div>
      <div className="w-90 bg-gray-200 h-2 rounded-full mt-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${props.progress.toFixed(2)}%` }}
        ></div>
      </div>
      <div className="text-right text-sm mt-2">{props.progress.toFixed(2)}%</div>
    </div>
  );
}

export default FileProgressCard;