import { z } from "zod";

export const dashboardPeriodSchema = z.enum([
  "month",
  "year",
  "custom",
  "all",
]);

export const dashboardQuerySchema = z
  .object({
    period: dashboardPeriodSchema.default("month"),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.period !== "custom") return;

    if (!value.from || !value.to) {
      ctx.addIssue({
        code: "custom",
        message: "Informe as datas inicial e final",
        path: ["from"],
      });
      return;
    }

    const fromDate = new Date(`${value.from}T00:00:00`);
    const toDate = new Date(`${value.to}T23:59:59.999`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Datas inválidas",
        path: ["from"],
      });
      return;
    }

    if (fromDate > toDate) {
      ctx.addIssue({
        code: "custom",
        message: "A data inicial deve ser anterior à final",
        path: ["from"],
      });
    }
  });

export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;
