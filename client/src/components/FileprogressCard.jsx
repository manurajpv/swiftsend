import { createSignal, createEffect, onCleanup } from "solid-js";

// A shared component to display the progress card
function FileProgressCard(props) {
  return (
    <div class="bg-white shadow-md rounded-md p-4 mb-4">
      <div class="text-lg font-semibold">{props.filename}</div>
      <div class="w-90 bg-gray-200 h-2 rounded-full mt-2">
        <div
          class="bg-blue-600 h-2 rounded-full"
          style={{ width: `${props.progress.toFixed(2)}%` }}
        ></div>
      </div>
      <div class="text-right text-sm mt-2">{props.progress.toFixed(2)}%</div>
    </div>
  );
}

export default FileProgressCard;
