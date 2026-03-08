import { useEffect, useState } from "react";
import { useBooking } from "@/hooks/useBooking";
import { supabase } from "@/lib/supabase";
import type { InventoryItem, CartItem } from "@/types/booking";
import { STORAGE_BASE_URL, DB } from "@/config/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, ArrowLeft, ShoppingCart, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TabKey = "equipment" | "chemicals" | "materials";

export function EquipmentPicker() {
  const { state, addToCart, updateCartQuantity, removeFromCart, setStep } = useBooking();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("equipment");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from(DB.tables.items).select("*");
    if (state.route === "C" && state.room) {
      query = query.eq(DB.itemsCols.lab, state.room);
    }
    const { data, error } = await query;
    if (!error && data) {
      setItems(data as InventoryItem[]);
      const eqCats = [...new Set(
        data
          .filter((d: InventoryItem) => d.category !== DB.chemicalCategory && d.category !== DB.consumableCategory)
          .map((d: InventoryItem) => d.category)
      )].sort();
      setCategories(eqCats);
      if (eqCats.length > 0) setActiveCategory(eqCats[0]);
    }
    setLoading(false);
  };

  const getFilteredItems = (): InventoryItem[] => {
    if (activeTab === "chemicals") return items.filter(i => i.category === DB.chemicalCategory);
    if (activeTab === "materials") return items.filter(i => i.category === DB.consumableCategory);
    if (!activeCategory) return items.filter(i => i.category !== DB.chemicalCategory && i.category !== DB.consumableCategory);
    return items.filter(i => i.category === activeCategory);
  };

  const getCartQty = (itemId: string) =>
    state.cart.find(c => c.item.id === itemId)?.quantity ?? 0;

  const handleQtyChange = (item: InventoryItem, delta: number) => {
    const current = getCartQty(item.id);
    const newQty = current + delta;
    if (newQty <= 0) {
      removeFromCart(item.id);
    } else if (current === 0) {
      addToCart({ item, quantity: 1 });
    } else {
      updateCartQuantity(item.id, Math.min(newQty, item.qty));
    }
  };

  const backStep = state.route === "C" ? 1 : 0;
  const nextStep = state.route === "B" ? 2 : state.route === "C" ? 3 : 3;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep(backStep)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Select Items</h2>
            <p className="text-muted-foreground text-sm">
              {state.route === "C" && state.room
                ? `Showing inventory for ${state.room}`
                : "Showing all available inventory"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="relative"
          onClick={() => setShowCart(!showCart)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {state.cart.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {state.cart.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Cart sidebar */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Selected Items ({state.cart.length})</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {state.cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items selected yet.</p>
                ) : (
                  <div className="space-y-2">
                    {state.cart.map(c => (
                      <div key={c.item.id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{c.item.stock_description}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.quantity} {c.item.uom}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFromCart(c.item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabKey)}>
        <TabsList className="w-full">
          <TabsTrigger value="equipment" className="flex-1">Equipment</TabsTrigger>
          <TabsTrigger value="chemicals" className="flex-1">Chemicals</TabsTrigger>
          <TabsTrigger value="materials" className="flex-1">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 py-3">
              {categories.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={activeCategory === cat ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="chemicals" />
        <TabsContent value="materials" />
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {getFilteredItems().map(item => {
          const cartQty = getCartQty(item.id);
          return (
            <Card key={item.id} className={`overflow-hidden transition-all ${cartQty > 0 ? "ring-2 ring-primary" : ""}`}>
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={`${STORAGE_BASE_URL}/${item.image_key}.png`}
                  alt={item.stock_description}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={e => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <h4 className="font-semibold text-sm leading-tight">{item.stock_description}</h4>
                {item.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {item.qty} {item.uom}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleQtyChange(item, -1)}
                      disabled={cartQty === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{cartQty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleQtyChange(item, 1)}
                      disabled={cartQty >= item.qty}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {getFilteredItems().length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No items found in this category.
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={() => setStep(nextStep)} disabled={state.cart.length === 0}>
          Continue ({state.cart.length} items selected)
        </Button>
      </div>
    </div>
  );
}
