import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import type { Category, Tag } from '@/types';

interface TaxonomyManagerProps {
  categories: Category[];
  tags: Tag[];
  disabled?: boolean;
  onAddCategory: (name: string, isShareable: boolean) => Promise<void> | void;
  onUpdateCategoryShareable: (category: Category, isShareable: boolean) => Promise<void> | void;
  onDeleteCategory: (category: Category) => Promise<void> | void;
  onAddTag: (name: string, isShareable: boolean) => Promise<void> | void;
  onUpdateTagShareable: (tag: Tag, isShareable: boolean) => Promise<void> | void;
  onDeleteTag: (tag: Tag) => Promise<void> | void;
}

function ShareableBadge({ isShareable }: { isShareable: boolean }) {
  return <Badge variant={isShareable ? 'default' : 'secondary'}>{isShareable ? 'משותף' : 'פרטי'}</Badge>;
}

export function TaxonomyManager({
  categories,
  tags,
  disabled = false,
  onAddCategory,
  onUpdateCategoryShareable,
  onDeleteCategory,
  onAddTag,
  onUpdateTagShareable,
  onDeleteTag,
}: TaxonomyManagerProps) {
  const [categoryName, setCategoryName] = useState('');
  const [tagName, setTagName] = useState('');
  const [newCategoryShareable, setNewCategoryShareable] = useState(false);
  const [newTagShareable, setNewTagShareable] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const visibleCategories = useMemo(
    () => [...categories].sort((first, second) => Number(second.isShareable) - Number(first.isShareable) || first.name.localeCompare(second.name)),
    [categories],
  );
  const visibleTags = useMemo(
    () => [...tags].sort((first, second) => Number(second.isShareable) - Number(first.isShareable) || first.name.localeCompare(second.name)),
    [tags],
  );

  const handleAddCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      return;
    }

    setPendingKey('category:new');
    try {
      await onAddCategory(name, newCategoryShareable);
      setCategoryName('');
      setNewCategoryShareable(false);
    } catch {
      // parent toast already explains the failure
    } finally {
      setPendingKey(null);
    }
  };

  const handleAddTag = async () => {
    const name = tagName.trim();
    if (!name) {
      return;
    }

    setPendingKey('tag:new');
    try {
      await onAddTag(name, newTagShareable);
      setTagName('');
      setNewTagShareable(false);
    } catch {
      // parent toast already explains the failure
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-medium">קטגוריות</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            קטגוריה משותפת הופכת את הפתקים שלה לגלויים לכל חברי הלוח. קטגוריה פרטית נשארת רק אצל יוצר הפתק.
          </p>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-category-name">שם קטגוריה חדשה</Label>
            <Input
              id="new-category-name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="למשל: Family"
              disabled={disabled || pendingKey === 'category:new'}
            />
          </div>
          <label className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span>לשתף עם כל חברי הלוח</span>
            <Switch
              checked={newCategoryShareable}
              onCheckedChange={setNewCategoryShareable}
              disabled={disabled || pendingKey === 'category:new'}
            />
          </label>
          <Button
            type="button"
            onClick={() => void handleAddCategory()}
            disabled={disabled || pendingKey === 'category:new' || !categoryName.trim()}
            className="w-full"
          >
            הוסף קטגוריה
          </Button>
        </div>

        <div className="space-y-2">
          {visibleCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין עדיין קטגוריות. אפשר להתחיל עם Family, Work או כל חלוקה אחרת שנוחה לכם.</p>
          ) : (
            visibleCategories.map((category) => {
              const rowKey = `category:${category.id}`;
              const rowBusy = pendingKey === rowKey;

              return (
                <div key={category.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      <ShareableBadge isShareable={category.isShareable} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.isShareable ? 'פתקים עם הקטגוריה הזאת יופיעו לכל חברי הלוח.' : 'פתקים עם הקטגוריה הזאת יישארו פרטיים כברירת מחדל.'}
                    </p>
                  </div>
                  <Switch
                    checked={category.isShareable}
                    disabled={disabled || rowBusy}
                    onCheckedChange={(checked) => {
                      setPendingKey(rowKey);
                      Promise.resolve(onUpdateCategoryShareable(category, checked))
                        .catch(() => undefined)
                        .finally(() => setPendingKey(null));
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || rowBusy}
                    onClick={() => {
                      setPendingKey(rowKey);
                      Promise.resolve(onDeleteCategory(category))
                        .catch(() => undefined)
                        .finally(() => setPendingKey(null));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-medium">תגיות</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            גם תגית משותפת יכולה להפוך פתק לזמין לכל חברי הלוח, אפילו אם הקטגוריה שלו פרטית.
          </p>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-tag-name">שם תגית חדשה</Label>
            <Input
              id="new-tag-name"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="למשל: Parents"
              disabled={disabled || pendingKey === 'tag:new'}
            />
          </div>
          <label className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span>לשתף עם כל חברי הלוח</span>
            <Switch checked={newTagShareable} onCheckedChange={setNewTagShareable} disabled={disabled || pendingKey === 'tag:new'} />
          </label>
          <Button
            type="button"
            onClick={() => void handleAddTag()}
            disabled={disabled || pendingKey === 'tag:new' || !tagName.trim()}
            className="w-full"
          >
            הוסף תגית
          </Button>
        </div>

        <div className="space-y-2">
          {visibleTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין עדיין תגיות. אפשר ליצור תגיות משותפות כמו School או Family לצד תגיות פרטיות כמו Work.</p>
          ) : (
            visibleTags.map((tag) => {
              const rowKey = `tag:${tag.id}`;
              const rowBusy = pendingKey === rowKey;

              return (
                <div key={tag.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      <p className="truncate text-sm font-medium">{tag.name}</p>
                      <ShareableBadge isShareable={tag.isShareable} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tag.isShareable ? 'כל פתק עם התגית הזאת יופיע לכל חברי הלוח.' : 'התגית הזאת תשאיר את הפתק פרטי, אלא אם נבחרה גם קטגוריה או תגית משותפת אחרת.'}
                    </p>
                  </div>
                  <Switch
                    checked={tag.isShareable}
                    disabled={disabled || rowBusy}
                    onCheckedChange={(checked) => {
                      setPendingKey(rowKey);
                      Promise.resolve(onUpdateTagShareable(tag, checked))
                        .catch(() => undefined)
                        .finally(() => setPendingKey(null));
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || rowBusy}
                    onClick={() => {
                      setPendingKey(rowKey);
                      Promise.resolve(onDeleteTag(tag))
                        .catch(() => undefined)
                        .finally(() => setPendingKey(null));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
