import React from 'react';
import { Card } from '@/components/ui/Card';

const SkeletonElement = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Message Skeleton */}
      <Card className="p-6">
        <SkeletonElement className="h-10 w-3/4 mb-2" />
        <SkeletonElement className="h-4 w-1/2" />
      </Card>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <SkeletonElement className="h-4 w-20 mb-2" />
                <SkeletonElement className="h-8 w-16" />
              </div>
              <SkeletonElement className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <SkeletonElement className="h-6 w-40 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <SkeletonElement className="h-8 w-8 mx-auto mb-2" />
              <SkeletonElement className="h-4 w-24 mx-auto" />
            </Card>
          ))}
        </div>
      </div>

      {/* Lists Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <SkeletonElement className="h-6 w-48 mb-3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <SkeletonElement className="h-4 w-24 mb-1" />
                  <SkeletonElement className="h-3 w-16" />
                </div>
                <SkeletonElement className="h-6 w-12" />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SkeletonElement className="h-6 w-40 mb-3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <SkeletonElement className="h-4 w-20 mb-1" />
                  <SkeletonElement className="h-3 w-12" />
                </div>
                <SkeletonElement className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};