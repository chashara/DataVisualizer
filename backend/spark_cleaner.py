from pyspark.sql import SparkSession
from pyspark.sql.types import NumericType

def clean_csv(input_path: str, output_path: str):
    spark = SparkSession.builder.appName("Backend CSV Cleaner").getOrCreate()

    df = spark.read.csv(input_path, header=True, inferSchema=True)

    # Get only numeric columns
    numeric_cols = [field.name for field in df.schema.fields if isinstance(field.dataType, NumericType)]

    # Drop rows with nulls only in numeric/statistical columns
    df_cleaned = df.dropna(subset=numeric_cols).dropDuplicates()

    df_cleaned.coalesce(1).write.csv(output_path, header=True, mode='overwrite')
    spark.stop()



def clean_json(input_path: str):
    spark = SparkSession.builder.appName("CleanJSON").getOrCreate()


    df = spark.read.option("multiline", "true").json(input_path)


    cleaned_df = df.dropna().dropDuplicates()


    result = [row.asDict() for row in cleaned_df.collect()]

    spark.stop()
    return result
