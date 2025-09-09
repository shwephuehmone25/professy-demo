import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SearchResult extends Document {
  @Prop({ required: true })
  keyword: string;

  @Prop({ required: true })
  url: string;
}

export const SearchResultSchema = SchemaFactory.createForClass(SearchResult);
