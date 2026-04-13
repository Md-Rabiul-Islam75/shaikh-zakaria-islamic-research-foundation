const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Student Management API",
    version: "1.0.0",
    description:
      "API documentation for the Student Management System — manage student admissions, records, and classes for schools in Bangladesh.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  paths: {
    "/api/students": {
      get: {
        summary: "Get all students",
        description:
          "Retrieve a list of students. Optionally filter by class and admission year.",
        tags: ["Students"],
        parameters: [
          {
            name: "class",
            in: "query",
            description: "Class number (1-10)",
            schema: { type: "integer", example: 1 },
          },
          {
            name: "year",
            in: "query",
            description: "Admission year",
            schema: { type: "integer", example: 2026 },
          },
        ],
        responses: {
          "200": {
            description: "List of students",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Student" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new student",
        description: "Add a new student record to the system.",
        tags: ["Students"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStudent" },
            },
          },
        },
        responses: {
          "201": {
            description: "Student created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" },
              },
            },
          },
        },
      },
    },
    "/api/students/{id}": {
      get: {
        summary: "Get a student by ID",
        description: "Retrieve a single student record by their ID.",
        tags: ["Students"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Student ID (cuid)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Student details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" },
              },
            },
          },
          "404": {
            description: "Student not found",
          },
        },
      },
      put: {
        summary: "Update a student",
        description:
          "Update an existing student record. Only include fields you want to update.",
        tags: ["Students"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Student ID (cuid)",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStudent" },
            },
          },
        },
        responses: {
          "200": {
            description: "Student updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a student",
        description:
          "Delete a student record and their associated Cloudinary image.",
        tags: ["Students"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Student ID (cuid)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Student deleted successfully",
          },
          "404": {
            description: "Student not found",
          },
        },
      },
    },
    "/api/upload": {
      post: {
        summary: "Upload an image",
        description: "Upload a student photo to Cloudinary.",
        tags: ["Upload"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Image file to upload",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Image uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: {
                      type: "string",
                      description: "Cloudinary secure URL",
                    },
                    publicId: {
                      type: "string",
                      description: "Cloudinary public ID",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "No file provided",
          },
        },
      },
    },
    "/api/promote": {
      post: {
        summary: "Promote students to next class",
        description:
          "Promotes selected students from one class to the next. Saves current class info to history and updates the student record.",
        tags: ["Promotion"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "students",
                  "fromClass",
                  "fromSession",
                  "toClass",
                  "toSession",
                ],
                properties: {
                  students: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        newRoll: { type: "integer" },
                      },
                    },
                  },
                  fromClass: { type: "integer", example: 1 },
                  fromSession: { type: "integer", example: 2026 },
                  toClass: { type: "integer", example: 2 },
                  toSession: { type: "integer", example: 2027 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Students promoted successfully",
          },
        },
      },
    },
    "/api/students/history/{id}": {
      get: {
        summary: "Get student class history",
        description: "Retrieve the promotion history of a student.",
        tags: ["Students"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Student ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List of class history records",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Student: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique ID (cuid)" },
          studentNameEn: { type: "string", description: "Name in English" },
          studentNameBn: {
            type: "string",
            nullable: true,
            description: "Name in Bangla",
          },
          fatherName: { type: "string" },
          motherName: { type: "string" },
          dateOfBirth: { type: "string", format: "date-time" },
          gender: {
            type: "string",
            enum: ["Male", "Female", "Other"],
          },
          religion: {
            type: "string",
            enum: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
          },
          nationality: { type: "string", default: "Bangladeshi" },
          bloodGroup: {
            type: "string",
            nullable: true,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
          },
          birthCertificateNo: { type: "string", nullable: true },
          phone: { type: "string", description: "Guardian phone number" },
          presentAddress: { type: "string" },
          permanentAddress: { type: "string", nullable: true },
          className: {
            type: "integer",
            description: "Class number (1-10)",
          },
          section: { type: "string", nullable: true },
          admissionYear: { type: "integer", example: 2026 },
          admissionFee: {
            type: "string",
            default: "Free",
            description: "Free or amount",
          },
          previousSchool: { type: "string", nullable: true },
          imageUrl: {
            type: "string",
            nullable: true,
            description: "Cloudinary image URL",
          },
          imagePublicId: {
            type: "string",
            nullable: true,
            description: "Cloudinary public ID",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateStudent: {
        type: "object",
        required: [
          "studentNameEn",
          "fatherName",
          "motherName",
          "dateOfBirth",
          "gender",
          "religion",
          "phone",
          "presentAddress",
          "className",
          "admissionYear",
        ],
        properties: {
          studentNameEn: { type: "string", example: "Rahim Uddin" },
          studentNameBn: { type: "string", example: "রহিম উদ্দিন" },
          fatherName: { type: "string", example: "Karim Uddin" },
          motherName: { type: "string", example: "Fatima Begum" },
          dateOfBirth: {
            type: "string",
            format: "date",
            example: "2015-03-15",
          },
          gender: { type: "string", enum: ["Male", "Female", "Other"] },
          religion: { type: "string", example: "Islam" },
          nationality: { type: "string", default: "Bangladeshi" },
          bloodGroup: { type: "string", example: "B+" },
          birthCertificateNo: { type: "string", example: "20151234567890" },
          phone: { type: "string", example: "01712345678" },
          presentAddress: {
            type: "string",
            example: "Village Char, Upazila Sadar, Comilla",
          },
          permanentAddress: { type: "string" },
          className: { type: "integer", example: 1 },
          section: { type: "string", example: "A" },
          admissionYear: { type: "integer", example: 2026 },
          admissionFee: { type: "string", example: "Free" },
          previousSchool: { type: "string" },
          imageUrl: { type: "string" },
          imagePublicId: { type: "string" },
        },
      },
    },
  },
};

export default swaggerSpec;
