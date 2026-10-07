package com.northstar.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.northstar", importOptions = ImportOption.DoNotIncludeTests.class)
public class HexagonalArchitectureTest {

        @ArchTest
        static final ArchRule domain_should_not_depend_on_application_or_adapters = noClasses()
                        .that().resideInAPackage("..domain..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..application..", "..adapter..");

        @ArchTest
        static final ArchRule domain_should_not_depend_on_spring_framework = noClasses()
                        .that().resideInAPackage("..domain..")
                        .should().dependOnClassesThat()
                        .resideInAPackage("org.springframework..");

        @ArchTest
        static final ArchRule domain_should_not_have_jpa_annotations = classes()
                        .that().resideInAPackage("..domain..")
                        .should().notBeAnnotatedWith("jakarta.persistence.Entity")
                        .andShould().notBeAnnotatedWith("jakarta.persistence.Table");

        @ArchTest
        static final ArchRule application_should_not_depend_on_adapters = noClasses()
                        .that().resideInAPackage("..application..")
                        .should().dependOnClassesThat()
                        .resideInAPackage("..adapter..");
}
