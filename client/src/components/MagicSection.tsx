import { Card } from "@/components/ui/card";
import { Sparkles, Star, MessageSquareQuote } from "lucide-react";

interface MagicSectionProps {
  zodiak: string;
  booster: string;
  quote: string;
  "data-testid"?: string;
}

export default function MagicSection({ zodiak, booster, quote, "data-testid": testId }: MagicSectionProps) {
  return (
    <Card 
      className="relative p-6 overflow-hidden border-magic/30 bg-gradient-to-br from-magic/5 to-magic/10"
      data-testid={testId}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-magic/10 rounded-full blur-3xl -mr-16 -mt-16" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-magic" />
          <h3 className="font-semibold text-lg">Magic Section</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-magic/20 p-2 mt-1">
              <Star className="w-4 h-4 text-magic" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Zodiak Booster</p>
              <p className="text-base font-semibold" data-testid={`${testId}-zodiak`}>{zodiak}</p>
              <p className="text-sm text-muted-foreground mt-1" data-testid={`${testId}-booster`}>
                {booster}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-magic/20">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-magic/20 p-2 mt-1">
                <MessageSquareQuote className="w-4 h-4 text-magic" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Quote Motivasi</p>
                <blockquote 
                  className="text-base italic leading-relaxed" 
                  data-testid={`${testId}-quote`}
                >
                  "{quote}"
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
