import { Link } from "react-router-dom";
import { useCartStore } from "../../../features/cart/model/cartStore";

export default function CartIcon() {
  const totalItems = useCartStore((s) => s.totalItems());
  return (
    <Link
      to="/carrito"
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-500 hover:text-white hover:bg-white/5 transition-all"
    >
      <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-sm shadow-sm">
        🛒
      </span>
      <span>Mi carrito</span>
      {totalItems > 0 && (
        <span className="absolute -top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
}