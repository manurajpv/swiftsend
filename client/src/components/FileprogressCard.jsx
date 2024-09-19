import { createSignal, createEffect, onCleanup } from "solid-js";

// A shared component to display the progress card
function FileProgressCard({ filename, progress }) {
  return (
    <div class="bg-white shadow-md rounded-md p-4 mb-4">
      <div class="text-lg font-semibold">{filename}</div>
      <div class="w-full bg-gray-200 h-2 rounded-full mt-2">
        <div
          class="bg-blue-600 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div class="text-right text-sm mt-2">{progress.toFixed(2)}%</div>
    </div>
  );
}

export default FileProgressCard;
