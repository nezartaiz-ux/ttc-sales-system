import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

interface Category {
  id: string;
  name: string;
}

export const useUserCategories = () => {
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRestrictions, setHasRestrictions] = useState(false);
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (roleLoading) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Get all categories
        const { data: categories, error: catError } = await supabase
          .from('product_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (catError) throw catError;
        setAllCategories(categories || []);

        // Admins have access to all categories
        if (isAdmin) {
          setUserCategories(categories || []);
          setHasRestrictions(false);
          setLoading(false);
          return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserCategories([]);
          setHasRestrictions(false);
          setLoading(false);
          return;
        }

        // Get user's assigned categories
        const { data: userCats, error: userCatError } = await supabase
          .from('user_categories')
          .select('category_id')
          .eq('user_id', user.id);

        if (userCatError) throw userCatError;

        // If user has no category restrictions, show all categories
        if (!userCats || userCats.length === 0) {
          setUserCategories(categories || []);
          setHasRestrictions(false);
        } else {
          // Filter categories to only those assigned to user
          const assignedCategoryIds = userCats.map(uc => uc.category_id);
          const filteredCategories = (categories || []).filter(cat => 
            assignedCategoryIds.includes(cat.id)
          );
          setUserCategories(filteredCategories);
          setHasRestrictions(true);
        }
      } catch (error) {
        console.error('Error fetching user categories:', error);
        setUserCategories([]);
        setHasRestrictions(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      fetchCategories();
    });

    return () => {
      authSub.subscription.unsubscribe();
    };
  }, [isAdmin, roleLoading]);

  // Helper to check if a category ID is accessible
  const canAccessCategory = (categoryId: string): boolean => {
    if (isAdmin || !hasRestrictions) return true;
    return userCategories.some(cat => cat.id === categoryId);
  };

  // Get category IDs for filtering queries
  const getCategoryIds = (): string[] => {
    return userCategories.map(cat => cat.id);
  };

  return {
    userCategories,
    allCategories,
    loading: loading || roleLoading,
    hasRestrictions,
    canAccessCategory,
    getCategoryIds,
    isAdmin,
  };
};
