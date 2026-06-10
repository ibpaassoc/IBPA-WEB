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
    <div className="overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white">
      <Table>
        <TableHeader className="bg-[#F6FAFF]">
          <TableRow className="border-b-[#D7E5F4] hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]",
                  column.className,
                )}
                key={column.key}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const key = getRowKey(item);
            const isSelected = selectedKey === key;
            return (
              <TableRow
                className={cn(
                  "border-b-[#E4EEF8] text-[#10203B] transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected
                    ? "bg-[#EEF6FF] hover:bg-[#EEF6FF]"
                    : "hover:bg-[#F6FAFF]",
                )}
                key={key}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <TableCell
                    className={cn("text-sm text-[#10203B]", column.className)}
                    key={column.key}
                  >
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
