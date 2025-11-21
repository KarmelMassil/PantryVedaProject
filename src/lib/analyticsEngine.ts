import { Ingredient, ConsumptionEvent, WasteEvent } from "@/types";
import { differenceInDays, subDays, addDays, format, startOfDay } from "date-fns";

// This is the main function that will calculate all our stats
export function calculateAnalytics(
    inventory: Ingredient[],
    consumptionLog: ConsumptionEvent[],
    wasteLog: WasteEvent[]
) {
    // --- 1. Summary Card Calculations ---
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
    
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentWaste = wasteLog.filter(e => new Date(e.timestamp) > thirtyDaysAgo);
    const recentConsumption = consumptionLog.filter(e => new Date(e.timestamp) > thirtyDaysAgo);
    
    // Calculate actual wasted and consumed values based on quantities
    const totalWastedValue = recentWaste.reduce((sum, event) => {
        const item = inventory.find(i => i.name === event.ingredientName);
        if (!item) return sum;
        // Calculate proportional value based on quantity wasted
        const proportionalValue = (event.quantityWasted / item.quantity) * item.value;
        return sum + proportionalValue;
    }, 0);
    
    const totalConsumedValue = recentConsumption.reduce((sum, event) => {
        const item = inventory.find(i => i.name === event.ingredientName);
        if (!item) return sum;
        // Calculate proportional value based on quantity consumed
        const proportionalValue = (event.quantityConsumed / item.quantity) * item.value;
        return sum + proportionalValue;
    }, 0);
    
    const foodWastePercentage = totalConsumedValue + totalWastedValue > 0 
        ? (totalWastedValue / (totalConsumedValue + totalWastedValue)) * 100 
        : 0;

    const shelfLives = inventory.map(item => differenceInDays(new Date(item.expiryDate), new Date()))
                                .filter(days => days >= 0);
    const avgShelfLife = shelfLives.length > 0 
        ? shelfLives.reduce((sum, days) => sum + days, 0) / shelfLives.length 
        : 0;
        
    const utilizationRate = 100 - foodWastePercentage;

    // --- 2. Chart Data Calculations ---
    
    // Bar Chart: Inventory by Category
    const categoryCounts = inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const inventoryByCategory = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    
    // Pie Chart: Expiry Status
    let freshCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    inventory.forEach(item => {
        const days = differenceInDays(new Date(item.expiryDate), new Date());
        if (days < 0) expiredCount++;
        else if (days <= 3) expiringSoonCount++;
        else freshCount++;
    });

    const expiryStatusData = [
        { name: 'Fresh', value: freshCount },
        { name: 'Expiring Soon', value: expiringSoonCount },
        { name: 'Expired', value: expiredCount },
    ].filter(d => d.value > 0); // Only show categories with items

    // --- 3. Categories Tab: Value Distribution ---
    const categoryValues = inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.value;
        return acc;
    }, {} as Record<string, number>);

    const valueByCategory = Object.entries(categoryValues)
        .map(([name, totalValue]) => ({ name, totalValue }))
        .sort((a, b) => b.totalValue - a.totalValue);

    // --- 4. Trends Tab: Items Added vs Used Over Time ---
    const trendStartDate = startOfDay(subDays(new Date(), 30));
    const trendDataMap = new Map<string, { added: number, used: number }>();
    
    // Populate dates for the last 30 days
    for (let i = 0; i < 30; i++) {
        const date = format(addDays(trendStartDate, i), 'MMM d');
        trendDataMap.set(date, { added: 0, used: 0 });
    }

    // Process "added" items (from inventory purchase dates)
    inventory.forEach(item => {
        const purchaseDate = new Date(item.purchaseDate);
        if (purchaseDate >= trendStartDate) {
            const dateStr = format(purchaseDate, 'MMM d');
            if (trendDataMap.has(dateStr)) {
                trendDataMap.get(dateStr)!.added += 1;
            }
        }
    });

    // Process "used" items (from consumption log)
    consumptionLog.forEach(event => {
        const consumptionDate = new Date(event.timestamp);
        if (consumptionDate >= trendStartDate) {
            const dateStr = format(consumptionDate, 'MMM d');
            if (trendDataMap.has(dateStr)) {
                trendDataMap.get(dateStr)!.used += 1;
            }
        }
    });
    
    const monthlyTrend = Array.from(trendDataMap, ([name, value]) => ({ name, ...value }));

    // --- 5. Insights Tab: Generate Smart Insights ---
    const insights: Array<{
        type: 'efficiency' | 'shopping' | 'expiry';
        title: string;
        message: string;
    }> = [];
    
    // High waste percentage
    if (foodWastePercentage > 50) {
        insights.push({
            type: 'efficiency' as const,
            title: 'High Food Waste Detected',
            message: `Your food waste is at ${foodWastePercentage.toFixed(1)}%. Try using ingredients with shorter shelf life first and plan meals around expiring items.`
        });
    } else if (foodWastePercentage > 30) {
        insights.push({
            type: 'efficiency' as const,
            title: 'Moderate Food Waste',
            message: `You're wasting ${foodWastePercentage.toFixed(1)}% of your food. Small improvements in meal planning could save you money!`
        });
    }

    // Low waste - positive reinforcement
    if (foodWastePercentage < 10 && (totalConsumedValue + totalWastedValue) > 0) {
        insights.push({
            type: 'efficiency' as const,
            title: 'Excellent Efficiency!',
            message: `Amazing! You're only wasting ${foodWastePercentage.toFixed(1)}% of your food. Keep up the great work managing your pantry.`
        });
    }

    // Vegetable heavy shopping
    if (categoryCounts['Vegetables'] && categoryCounts['Vegetables'] > totalItems / 2) {
         insights.push({
            type: 'shopping' as const,
            title: 'Vegetable-Heavy Inventory',
            message: 'You have a lot of vegetables. Consider diversifying with more grains, proteins, and dairy for a balanced pantry.'
        });
    }

    // Low inventory warning
    if (totalItems < 5 && totalItems > 0) {
        insights.push({
            type: 'shopping' as const,
            title: 'Low Inventory Alert',
            message: `You only have ${totalItems} items in your pantry. Time to stock up on essentials!`
        });
    }

    // High value at risk
    const expiringValue = inventory
        .filter(item => differenceInDays(new Date(item.expiryDate), new Date()) <= 3)
        .reduce((sum, item) => sum + item.value, 0);
    
    if (expiringValue > totalValue * 0.2 && expiringValue > 100) {
        insights.push({
            type: 'expiry' as const,
            title: 'High Value at Risk',
            message: `₹${expiringValue.toFixed(0)} worth of ingredients are expiring soon! Use them quickly to avoid waste.`
        });
    }

    // Expiring soon percentage
    const expiringSoonPercentage = totalItems > 0 ? (expiringSoonCount / totalItems) * 100 : 0;
    if (expiringSoonPercentage > 20) {
         insights.push({
            type: 'expiry' as const,
            title: 'Critical Expiry Alert',
            message: `${expiringSoonPercentage.toFixed(0)}% of your items are expiring within 3 days. Plan meals immediately to use them!`
        });
    } else if (expiringSoonPercentage > 10) {
        insights.push({
            type: 'expiry' as const,
            title: 'Items Expiring Soon',
            message: `${expiringSoonCount} items are expiring within 3 days. Check your pantry and plan accordingly.`
        });
    }

    // Already expired items
    if (expiredCount > 0) {
        insights.push({
            type: 'expiry' as const,
            title: 'Expired Items Found',
            message: `You have ${expiredCount} expired item${expiredCount > 1 ? 's' : ''} in your inventory. Remove them to keep your pantry fresh.`
        });
    }

    // Category imbalance - missing essentials
    const hasSpices = categoryCounts['Spices'] && categoryCounts['Spices'] > 0;
    const hasGrains = categoryCounts['Grains'] && categoryCounts['Grains'] > 0;
    if (!hasSpices && totalItems > 5) {
        insights.push({
            type: 'shopping' as const,
            title: 'Missing Spices',
            message: 'Your pantry has no spices! Stock up on essentials like turmeric, cumin, and coriander for flavorful cooking.'
        });
    }
    if (!hasGrains && totalItems > 5) {
        insights.push({
            type: 'shopping' as const,
            title: 'Missing Grains',
            message: 'No grains in your pantry? Consider adding rice, wheat, or lentils as staple ingredients.'
        });
    }

    // Excellent shelf life management
    if (avgShelfLife > 14 && totalItems > 5) {
        insights.push({
            type: 'efficiency' as const,
            title: 'Great Shelf Life Management',
            message: `Your average shelf life is ${Math.round(avgShelfLife)} days. You're buying fresh and planning well!`
        });
    }

    // High utilization rate
    if (utilizationRate > 90 && (totalConsumedValue + totalWastedValue) > 0) {
        insights.push({
            type: 'efficiency' as const,
            title: 'Excellent Utilization',
            message: `${utilizationRate.toFixed(1)}% utilization rate! You're making the most of your ingredients.`
        });
    }

    // Most used ingredient
    if (recentConsumption.length > 0) {
        const consumptionCounts = recentConsumption.reduce((acc, event) => {
            acc[event.ingredientName] = (acc[event.ingredientName] || 0) + event.quantityConsumed;
            return acc;
        }, {} as Record<string, number>);

        const mostUsedIngredient = Object.entries(consumptionCounts).sort((a, b) => b[1] - a[1])[0];

        if (mostUsedIngredient) {
            insights.push({
                type: 'shopping' as const,
                title: 'Top Ingredient',
                message: `Your most used ingredient recently is '${mostUsedIngredient[0]}'. Consider buying it in bulk!`
            });
        }
    }

    // Empty pantry
    if (totalItems === 0) {
        insights.push({
            type: 'shopping' as const,
            title: 'Empty Pantry',
            message: 'Your pantry is empty! Start by adding some essential ingredients to begin tracking.'
        });
    }

    return {
        summary: {
            totalItems,
            totalValue,
            foodWastePercentage,
            avgShelfLife,
            utilizationRate
        },
        charts: {
            inventoryByCategory,
            expiryStatusData
        },
        categories: {
            valueByCategory
        },
        trends: {
            monthlyTrend
        },
        insights
    };
}