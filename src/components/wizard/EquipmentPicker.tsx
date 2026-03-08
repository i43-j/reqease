import { useEffect, useState } from "react";
import { useBooking } from "@/hooks/useBooking";
import { supabase } from "@/lib/supabase";
import type { InventoryItem, CartItem } from "@/types/booking";
import { STORAGE_BASE_URL, DB, ROOMS } from "@/config/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, ArrowLeft, ShoppingCart, Loader2, Search, CheckCircle2 } from "lucide-react";

type TabKey = "equipment" | "chemicals" | "materials";

export function EquipmentPicker() {
  const { state, addToCart, updateCartQuantity, removeFromCart, setStep } = useBooking();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("equipment");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");

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
    let filtered: InventoryItem[];
    if (activeTab === "chemicals") filtered = items.filter(i => i.category === DB.chemicalCategory);
    else if (activeTab === "materials") filtered = items.filter(i => i.category === DB.consumableCategory);
    else if (!activeCategory) filtered = items.filter(i => i.category !== DB.chemicalCategory && i.category !== DB.consumableCategory);
    else filtered = items.filter(i => i.category === activeCategory && i.category !== DB.chemicalCategory && i.category !== DB.consumableCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.stock_description.toLowerCase().includes(q) ||
        (i.notes && i.notes.toLowerCase().includes(q))
      );
    }
    return filtered;
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
  const filtered = getFilteredItems();
  const totalCartItems = state.cart.reduce((sum, c) => sum + c.quantity, 0);

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(backStep)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Select Items</h2>
          <p className="text-muted-foreground text-sm">
            {state.route === "C" && state.room
              ? `Showing inventory for ${ROOMS.find(r => r.code === state.room)?.name ?? state.room}`
              : "Showing all available inventory"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items..."
          className="pl-10 h-11"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as TabKey); setSearch(""); }}>
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

      {/* Main layout: items grid + cart sidebar */}
      <div className="flex gap-6 items-start">
        {/* Items grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available {activeTab}
            </p>
            <p className="text-xs text-muted-foreground">{filtered.length} items</p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No items found.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch">
              {filtered.map(item => {
                const cartQty = getCartQty(item.id);
                const inCart = cartQty > 0;
                const isToggleable = activeTab === "chemicals" || activeTab === "materials";

                const handleToggle = () => {
                  if (inCart) {
                    removeFromCart(item.id);
                  } else {
                    addToCart({ item, quantity: 1 });
                  }
                };

                return (
                  <Card
                    key={item.id}
                    className={`overflow-hidden transition-all relative flex flex-col ${inCart ? "ring-2 ring-primary" : ""} ${isToggleable ? "cursor-pointer" : ""}`}
                    onClick={isToggleable ? handleToggle : undefined}
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 z-10">
                        <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                      </div>
                    )}
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={`${STORAGE_BASE_URL}/${item.image_key}${DB.imageExtension}`}
                        alt={item.stock_description}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <CardContent className="p-3 flex flex-col flex-1">
                      <h4 className="font-semibold text-sm leading-tight">{item.stock_description}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[1rem] mt-1">
                        {item.notes ?? "\u00A0"}
                      </p>
                      <div className="mt-auto pt-2">
                        {!isToggleable && (
                          <>
                            <p className="text-xs text-muted-foreground mb-1">Available: {item.qty}</p>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQtyChange(item, -1)}
                                disabled={cartQty === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-10 text-center text-sm font-semibold">{cartQty}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQtyChange(item, 1)}
                                disabled={cartQty >= item.qty}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <div className="hidden md:block w-72 shrink-0 sticky top-24">
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">Cart Summary</h3>
                </div>
                {totalCartItems > 0 && (
                  <Badge className="text-xs">{totalCartItems} items</Badge>
                )}
              </div>

              {state.cart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No items selected yet.</p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {state.cart.map(c => (
                    <div key={c.item.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.item.stock_description}</p>
                        <p className="text-xs text-muted-foreground">Qty: {c.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQtyChange(c.item, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{c.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQtyChange(c.item, 1)}
                          disabled={c.quantity >= c.item.qty}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setStep(nextStep)}
                disabled={state.cart.length === 0}
                className="w-full"
              >
                Continue ({state.cart.length} items)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-40">
        <Button
          onClick={() => setStep(nextStep)}
          disabled={state.cart.length === 0}
          className="w-full"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Continue ({totalCartItems} items in cart)
        </Button>
      </div>
    </div>
  );
}
