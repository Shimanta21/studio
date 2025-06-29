
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useApp } from '@/context/app-context';
import { format, subDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { IndianRupee, Package, ShoppingCart, ArrowUpRight, TrendingUp, CalendarDays, Star, Trophy, BarChart3 } from 'lucide-react';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type TopProduct = { name: string; quantity: number };

export default function DashboardPage() {
  const { products, sales, getDailySales } = useApp();
  const [currentDate] = React.useState(startOfDay(new Date()));

  const totalStock = React.useMemo(() => products.reduce((sum, p) => sum + p.stockInHand, 0), [products]);
  const productsNearingExpiry = React.useMemo(() => products.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)).length, [products, currentDate]);
  
  const todaySales = React.useMemo(() => getDailySales(currentDate), [getDailySales, currentDate]);
  const todaysRevenue = React.useMemo(() => todaySales.reduce((sum, s) => sum + s.totalAmount, 0), [todaySales]);
  const itemsSoldToday = React.useMemo(() => todaySales.reduce((sum, s) => sum + s.quantity, 0), [todaySales]);

  // New metric calculations
  const monthlyRevenue = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return sales
      .filter(s => {
        const saleDate = new Date(s.saleDate);
        return saleDate >= monthStart && saleDate <= monthEnd;
      })
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales, currentDate]);

  const topSellingLastWeek = React.useMemo<TopProduct | null>(() => {
    const sevenDaysAgo = subDays(currentDate, 7);
    const weeklySales = sales.filter(s => new Date(s.saleDate) >= sevenDaysAgo);
    if (weeklySales.length === 0) return null;

    const productSales = weeklySales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {} as { [key: string]: number });

    const topProduct = Object.entries(productSales).sort(([, qtyA], [, qtyB]) => qtyB - qtyA)[0];
    return { name: topProduct[0], quantity: topProduct[1] };
  }, [sales, currentDate]);

  const topSellingLastMonth = React.useMemo<TopProduct | null>(() => {
    const monthStart = startOfMonth(currentDate);
    const monthlySales = sales.filter(s => new Date(s.saleDate) >= monthStart);
     if (monthlySales.length === 0) return null;

    const productSales = monthlySales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {} as { [key: string]: number });

    const topProduct = Object.entries(productSales).sort(([, qtyA], [, qtyB]) => qtyB - qtyA)[0];
    return { name: topProduct[0], quantity: topProduct[1] };
  }, [sales, currentDate]);


  const weeklySalesData = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(currentDate, 6 - i);
      const dailySales = sales.filter(s => s.saleDate === format(date, 'yyyy-MM-dd'));
      return {
        date: format(date, 'MMM d'),
        sales: dailySales.reduce((sum, s) => sum + s.totalAmount, 0),
      };
    });
  }, [sales, currentDate]);

  const monthlySalesData = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map(day => {
        const formattedDay = format(day, 'yyyy-MM-dd');
        const dailySales = sales.filter(s => s.saleDate === formattedDay);
        return {
            date: format(day, 'd'), // e.g. "1", "2", ... "31"
            sales: dailySales.reduce((sum, s) => sum + s.totalAmount, 0),
        };
    });
}, [sales, currentDate]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaysRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total sales for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{itemsSoldToday}</div>
            <p className="text-xs text-muted-foreground">Total items sold today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">Total items in hand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsNearingExpiry}</div>
            <p className="text-xs text-muted-foreground">Items expiring in next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{monthlyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total revenue for {format(currentDate, 'MMMM')}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Seller (Last 7 Days)</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">{topSellingLastWeek?.name || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                    {topSellingLastWeek ? `Sold ${topSellingLastWeek.quantity} units` : 'No sales in the last 7 days'}
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Seller (This Month)</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">{topSellingLastMonth?.name || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                    {topSellingLastMonth ? `Sold ${topSellingLastMonth.quantity} units` : `in ${format(currentDate, 'MMMM')}`}
                </p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={weeklySalesData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.split(' ')[1]}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySales.length > 0 ? todaySales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">No sales today.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Monthly Sales ({format(currentDate, 'MMMM')})</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={monthlySalesData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => `₹${value}`}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

