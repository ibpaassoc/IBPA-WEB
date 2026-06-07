import type { AdminTableColumn } from "../types/admin.types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminTableProps<TItem> = {
  columns: Array<AdminTableColumn<TItem>>;
  items: TItem[];
  getRowKey: (item: TItem) => string;
  onRowClick?: (item: TItem) => void;
  selectedKey?: string | null;
};

export function AdminTable<TItem>({
  columns,
  getRowKey,
  items,
  onRowClick,
  selectedKey,
}: AdminTableProps<TItem>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const key = getRowKey(item);
            return (
              <TableRow
                className={cn(
                  onRowClick && "cursor-pointer",
                  selectedKey === key && "bg-muted/70",
                )}
                key={key}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
