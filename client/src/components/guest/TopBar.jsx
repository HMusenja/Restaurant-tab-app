// export default function TopBar({ tableNumber, itemCount, onOpenCart }) {
//   return (
//     <div className="sticky top-0 z-10 border-b bg-white">
//       <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
//         <div>
//           <div className="text-sm text-gray-500">Table</div>
//           <div className="text-lg font-semibold">{tableNumber ?? "?"}</div>
//         </div>

//         <button
//           onClick={onOpenCart}
//           className="relative rounded-xl bg-black px-4 py-2 text-white"
//         >
//           Cart
//           <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-sm">
//             {itemCount}
//           </span>
//         </button>
//       </div>
//     </div>
//   );
// }

import { ShoppingBag, UtensilsCrossed, Wifi } from "lucide-react";

export default function TopBar({ tableNumber, itemCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Brand + Table */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </div>

          {tableNumber && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-gray-500">Table</span>
              <span className="text-sm font-semibold">{tableNumber}</span>
            </div>
          )}
        </div>

        {/* Right: Connection + Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-emerald-600">
            <Wifi className="h-4 w-4" />
            <span className="text-xs font-medium">Connected</span>
          </div>

          <button
            onClick={onOpenCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 active:scale-[0.98]"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />

            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

